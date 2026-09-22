const { redisGet, redisSet } = require("../utils/redis");
const { sendZaloText, sendZaloToGroup, getFollowers } = require("../utils/zaloApi");
const Category = require("../models/Category");
const SendLog = require("../models/SendLog");

const FOLLOWERS_KEY = "tralien_oa_followers";
const GROUPS_KEY = "tralien_oa_groups";

async function getCachedFollowers() {
  const raw = await redisGet(FOLLOWERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function syncFollowers() {
  const followers = [];
  let offset = 0;
  const count = 50;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await getFollowers({ offset, count });
    if (res.error && res.error !== 0) {
      throw new Error(`Zalo API Error ${res.error}: ${res.message}`);
    }
    const batch = res?.data?.followers || [];
    followers.push(...batch);
    if (batch.length < count) break;
    offset += count;
  }
  const { getUserProfile } = require("../utils/zaloApi");

  const profiles = [];
  const chunkSize = 20;
  for (let i = 0; i < followers.length; i += chunkSize) {
    const chunk = followers.slice(i, i + chunkSize);
    const p = await Promise.all(
      chunk.map(async (f) => {
        try {
          const profileRes = await getUserProfile(f.user_id);
          if (profileRes.error === 0 && profileRes.data) {
            return {
              user_id: f.user_id,
              display_name: profileRes.data.display_name,
              avatar: profileRes.data.avatar,
            };
          }
        } catch (e) {}
        return { user_id: f.user_id };
      })
    );
    profiles.push(...p);
  }

  await redisSet(FOLLOWERS_KEY, JSON.stringify(profiles));
  return profiles;
}

async function getGroups() {
  const raw = await redisGet(GROUPS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function addGroup({ id, name }) {
  const groups = await getGroups();
  if (!groups.some((g) => g.id === id)) {
    groups.push({ id, name: name || id });
    await redisSet(GROUPS_KEY, JSON.stringify(groups));
  }
  return getGroups();
}

async function removeGroup(id) {
  const groups = (await getGroups()).filter((g) => g.id !== id);
  await redisSet(GROUPS_KEY, JSON.stringify(groups));
  return groups;
}

async function importGroupsFromCategories() {
  const categories = await Category.find({ zaloGroupId: { $ne: "" } }).lean();
  const groups = await getGroups();
  for (const cat of categories) {
    if (!groups.some((g) => g.id === cat.zaloGroupId)) {
      groups.push({ id: cat.zaloGroupId, name: cat.name });
    }
  }
  await redisSet(GROUPS_KEY, JSON.stringify(groups));
  return groups;
}

// --- sending, with a simple in-memory job progress tracker ---

const jobs = new Map(); // jobId -> { total, sent, failed, done }

// ttlMs: job gửi lâu (vd. thẻ tin tới hàng nghìn người, 500ms/người) phải sống
// lâu hơn thời gian gửi, nếu không bị xoá giữa chừng và trang theo dõi mất tiến độ.
function createJob(total, ttlMs = 10 * 60 * 1000) {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  jobs.set(jobId, { total, sent: 0, failed: 0, done: false });
  // auto-purge so this Map doesn't grow unbounded
  setTimeout(() => jobs.delete(jobId), ttlMs).unref?.();
  return jobId;
}

function getJobStatus(jobId) {
  return jobs.get(jobId) || null;
}

async function sendBroadcast({ userIds, message, attachments = {}, adminNote, sentBy, linkUrl, linkTitle }) {
  const {
    attachmentIds = [],
    videoAttachmentId = null,
    fileAttachmentId = null,
  } = attachments;

  const jobId = createJob(userIds.length);
  const job = jobs.get(jobId);

  const {
    sendZaloText,
    sendZaloToGroup,
    sendZaloImages,
    sendZaloImagesToGroup,
    sendZaloImageWithLink,
    sendZaloImageWithLinkToGroup,
    sendZaloFile,
    sendZaloFileToGroup,
  } = require("../utils/zaloApi");

  // Fire-and-forget: the caller polls getJobStatus(jobId) for progress.
  (async () => {
    for (const id of userIds) {
      try {
        const isGroup = id.startsWith("g:");
        const targetId = isGroup ? id.slice(2) : id;

        let textToSend = message || "";
        if (linkUrl) {
          const linkLine = linkTitle ? `🔗 ${linkTitle}: ${linkUrl}` : `🔗 ${linkUrl}`;
          textToSend = textToSend ? `${textToSend}\n\n${linkLine}` : linkLine;
        }

        if (textToSend) {
          const result = isGroup
            ? await sendZaloToGroup(textToSend, targetId)
            : await sendZaloText(targetId, textToSend);
          if (result?.error && result.error !== 0) throw new Error("Send text failed");
        }

        if (attachmentIds.length > 0) {
          isGroup
            ? await sendZaloImagesToGroup(targetId, attachmentIds)
            : await sendZaloImages(targetId, attachmentIds);
        }

        if (videoAttachmentId) {
          if (videoAttachmentId.startsWith("VIDLINK:")) {
            const rest = videoAttachmentId.slice(8);
            const sep = rest.indexOf(":");
            const thumbId = rest.slice(0, sep);
            const videoUrl = rest.slice(sep + 1);
            try {
              isGroup
                ? await sendZaloImageWithLinkToGroup(targetId, thumbId, videoUrl, "▶ Xem video")
                : await sendZaloImageWithLink(targetId, thumbId, videoUrl, "▶ Xem video");
            } catch (e) {
              const msg = `📹 Xem video: ${videoUrl}`;
              isGroup ? await sendZaloToGroup(msg, targetId) : await sendZaloText(targetId, msg);
            }
          } else if (videoAttachmentId.startsWith("http")) {
            const msg = `📹 Xem video: ${videoAttachmentId}`;
            isGroup ? await sendZaloToGroup(msg, targetId) : await sendZaloText(targetId, msg);
          } else {
            const msg = `📹 Xem video: https://zalo.me/oa/article/post?token=${videoAttachmentId}`;
            isGroup ? await sendZaloToGroup(msg, targetId) : await sendZaloText(targetId, msg);
          }
        }

        if (fileAttachmentId) {
          isGroup
            ? await sendZaloFileToGroup(targetId, fileAttachmentId)
            : await sendZaloFile(targetId, fileAttachmentId);
        }

        job.sent += 1;
      } catch (err) {
        job.failed += 1;
      }
      // stagger sends to stay well under Zalo OA rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    job.done = true;

    let logMsg = message || "";
    if (!logMsg) {
      if (videoAttachmentId) logMsg = "[video]";
      else if (fileAttachmentId) logMsg = "[file]";
      else if (attachmentIds.length > 0) logMsg = `[${attachmentIds.length} ảnh]`;
      else if (linkUrl) logMsg = `[link] ${linkUrl}`;
    }

    try {
      await SendLog.create({
        message: logMsg,
        recipientCount: userIds.length,
        sentCount: job.sent,
        failedCount: job.failed,
        sentBy,
        adminNote,
      });
    } catch (e) {
      console.error("Failed to save broadcast log:", e);
    }
  })();

  return jobId;
}

module.exports = {
  getCachedFollowers,
  syncFollowers,
  getGroups,
  addGroup,
  removeGroup,
  importGroupsFromCategories,
  sendBroadcast,
  createJob,
  getJobStatus,
};
