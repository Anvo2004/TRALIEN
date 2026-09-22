const { getAccessToken, refreshAccessToken } = require("./zaloToken");

const OA_BASE = "https://openapi.zalo.me/v2.0/oa";

// Wraps every OA call: injects the current access token, and if Zalo reports
// error -216 (token expired) retries exactly once with a freshly refreshed one.
async function zaloPost(path, body, { retried = false } = {}) {
  const accessToken = await getAccessToken();
  const res = await fetch(`${OA_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: accessToken,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  if (data.error === -216 && !retried) {
    await refreshAccessToken();
    return zaloPost(path, body, { retried: true });
  }
  return data;
}

async function zaloGet(path, { retried = false } = {}) {
  const accessToken = await getAccessToken();
  const res = await fetch(`${OA_BASE}${path}`, {
    headers: { access_token: accessToken },
  });
  const data = await res.json();

  if (data.error === -216 && !retried) {
    await refreshAccessToken();
    return zaloGet(path, { retried: true });
  }
  return data;
}

function textMessageBody(recipient, text) {
  return {
    recipient,
    message: { text },
  };
}

async function sendZaloText(userId, text) {
  return zaloPost("/message", textMessageBody({ user_id: userId }, text));
}

async function sendZaloToGroup(text, groupId) {
  if (!groupId) return { error: -1, message: "Missing groupId" };
  return zaloPost("/message", textMessageBody({ group_id: groupId }, text));
}

async function getFollowers({ offset = 0, count = 50 } = {}) {
  const data = encodeURIComponent(JSON.stringify({ offset, count }));
  return zaloGet(`/getfollowers?data=${data}`);
}

async function getUserProfile(userId) {
  const data = encodeURIComponent(JSON.stringify({ user_id: userId }));
  return zaloGet(`/getprofile?data=${data}`);
}

async function uploadImageToZalo(filepath) {
  const fs = require("fs");
  const path = require("path");
  const buffer = fs.readFileSync(filepath);
  const filename = path.basename(filepath);

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: "image/jpeg" }), filename);

  const accessToken = await getAccessToken();
  const res = await fetch("https://openapi.zalo.me/v2.0/oa/upload/image", {
    method: "POST",
    headers: { access_token: accessToken },
    body: form,
  });
  const data = await res.json();
  if (data.error !== 0) throw new Error(`Upload ảnh thất bại: ${data.message}`);
  return data.data.attachment_id;
}

async function uploadFileToZalo(filepath, originalFilename) {
  const fs = require("fs");
  const path = require("path");

  const ext = path.extname(originalFilename).toLowerCase();
  const safeBase = path.basename(originalFilename, ext)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d").replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeFilename = (safeBase || "document") + ext;

  let contentType = "application/octet-stream";
  if (ext === ".pdf") contentType = "application/pdf";
  else if (ext === ".doc") contentType = "application/msword";
  else if (ext === ".csv") contentType = "text/csv";

  const buffer = fs.readFileSync(filepath);
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: contentType }), safeFilename);

  const accessToken = await getAccessToken();
  const res = await fetch("https://openapi.zalo.me/v2.0/oa/upload/file", {
    method: "POST",
    headers: { access_token: accessToken },
    body: form,
  });
  const data = await res.json();
  if (data.error !== 0) throw new Error(`Upload file thất bại: ${data.message}`);
  return data.data.token;
}

async function sendZaloImages(userId, attachmentIds) {
  for (const attachId of attachmentIds) {
    try {
      await zaloPost("/message", {
        recipient: { user_id: String(userId) },
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "media",
              elements: [{ media_type: "image", attachment_id: attachId }],
            },
          },
        },
      });
    } catch (e) {}
  }
}

async function sendZaloImagesToGroup(groupId, attachmentIds) {
  for (const attachId of attachmentIds) {
    try {
      await zaloPost("/message", {
        recipient: { group_id: String(groupId) },
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "media",
              elements: [{ media_type: "image", attachment_id: attachId }],
            },
          },
        },
      });
    } catch (e) {}
  }
}

// "Thẻ tin": tin tư vấn dạng danh sách (list template) 1 phần tử — Zalo hiển thị
// ảnh lớn + tiêu đề đậm + mô tả, bấm vào mở element.default_action.url. Cùng cơ
// chế HOATIEN/QUESON đã chạy thật (zaloBroadcast.sendArticleCard). Ném lỗi kèm
// mã Zalo (err.zaloCode) để job gửi đếm và gom theo mã.
async function sendZaloCard(targetId, element, isGroup = false) {
  const data = await zaloPost("/message", {
    recipient: isGroup ? { group_id: String(targetId) } : { user_id: String(targetId) },
    message: {
      attachment: {
        type: "template",
        payload: { template_type: "list", elements: [element] },
      },
    },
  });
  if (data.error !== 0) {
    const err = new Error(data.message || "Zalo API lỗi");
    err.zaloCode = data.error;
    throw err;
  }
  return data;
}

async function sendZaloImageWithLink(userId, attachmentId, url, buttonTitle = "▶ Xem") {
  return zaloPost("/message", {
    recipient: { user_id: String(userId) },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "media",
          elements: [{
            media_type: "image",
            attachment_id: attachmentId,
            buttons: [{ title: buttonTitle, type: "oa.open.url", payload: { url } }],
          }],
        },
      },
    },
  });
}

async function sendZaloImageWithLinkToGroup(groupId, attachmentId, url, buttonTitle = "▶ Xem") {
  return zaloPost("/message", {
    recipient: { group_id: String(groupId) },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "media",
          elements: [{
            media_type: "image",
            attachment_id: attachmentId,
            buttons: [{ title: buttonTitle, type: "oa.open.url", payload: { url } }],
          }],
        },
      },
    },
  });
}

async function sendZaloFile(userId, fileToken) {
  return zaloPost("/message", {
    recipient: { user_id: String(userId) },
    message: { attachment: { type: "file", payload: { token: fileToken } } },
  });
}

async function sendZaloFileToGroup(groupId, fileToken) {
  return zaloPost("/message", {
    recipient: { group_id: String(groupId) },
    message: { attachment: { type: "file", payload: { token: fileToken } } },
  });
}

async function createZaloGroup(name, memberIds, description = "") {
  const assetId = process.env.ZALO_APP_ID;
  if (!assetId) throw new Error("Chưa cấu hình ZALO_APP_ID trong hệ thống (file .env)");

  const accessToken = await getAccessToken();
  let res = await fetch("https://openapi.zalo.me/v3.0/oa/group/creategroupwithoa", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: accessToken,
    },
    body: JSON.stringify({
      group_name: String(name),
      group_description: String(description || name),
      asset_id: String(assetId),
      member_user_ids: memberIds.map(String),
    }),
  });
  let data = await res.json();

  if (data.error === -216) {
    const newToken = await refreshAccessToken();
    res = await fetch("https://openapi.zalo.me/v3.0/oa/group/creategroupwithoa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: newToken,
      },
      body: JSON.stringify({
        group_name: String(name),
        group_description: String(description || name),
        asset_id: String(assetId),
        member_user_ids: memberIds.map(String),
      }),
    });
    data = await res.json();
  }

  if (data.error !== 0) {
    throw new Error(`Tạo nhóm Zalo thất bại: [${data.error}] ${data.message}`);
  }
  return data.data.group_id;
}

async function getGroupMembersV3(groupId) {
  const accessToken = await getAccessToken();
  let res = await fetch(`https://openapi.zalo.me/v3.0/oa/group/listmember?group_id=${groupId}&offset=0&count=50`, {
    headers: { access_token: accessToken },
  });
  let data = await res.json();

  if (data.error === -216) {
    const { refreshAccessToken } = require("./zaloToken");
    const newToken = await refreshAccessToken();
    res = await fetch(`https://openapi.zalo.me/v3.0/oa/group/listmember?group_id=${groupId}&offset=0&count=50`, {
      headers: { access_token: newToken },
    });
    data = await res.json();
  }
  if (data.error !== 0) {
    console.warn(`[Zalo] listmember group=${groupId} lỗi:`, data.error, data.message);
  }
  return data.data?.members || [];
}

// Danh sách người đang chờ duyệt vào nhóm (join request). Trả { members, total }.
async function getPendingGroupMembers(groupId, offset = 0, count = 50) {
  const url = `https://openapi.zalo.me/v3.0/oa/group/listpendinginvite?group_id=${groupId}&offset=${offset}&count=${count}`;
  let res = await fetch(url, { headers: { access_token: await getAccessToken() } });
  let data = await res.json();
  if (data.error === -216) {
    const newToken = await refreshAccessToken();
    res = await fetch(url, { headers: { access_token: newToken } });
    data = await res.json();
  }
  if (data.error !== 0) {
    console.warn(`[Zalo] listpendinginvite group=${groupId} lỗi:`, data.error, data.message);
  }
  const d = data.data || {};
  return { members: d.members || [], total: d.total || 0 };
}

async function postGroupInvite(path, groupId, memberUserIds) {
  const url = `https://openapi.zalo.me/v3.0/oa/group/${path}`;
  const body = JSON.stringify({
    group_id: String(groupId),
    member_user_ids: memberUserIds.map(String),
  });
  const headers = (t) => ({ access_token: t, "Content-Type": "application/json" });
  let res = await fetch(url, { method: "POST", headers: headers(await getAccessToken()), body });
  let data = await res.json();
  if (data.error === -216) {
    const newToken = await refreshAccessToken();
    res = await fetch(url, { method: "POST", headers: headers(newToken), body });
    data = await res.json();
  }
  if (data.error !== 0) throw new Error(`Zalo error ${data.error}: ${data.message}`);
  return true;
}

// Duyệt / từ chối yêu cầu vào nhóm
async function acceptGroupJoinRequest(groupId, memberUserIds) {
  return postGroupInvite("acceptpendinginvite", groupId, memberUserIds);
}
async function rejectGroupJoinRequest(groupId, memberUserIds) {
  return postGroupInvite("rejectpendinginvite", groupId, memberUserIds);
}

module.exports = {
  zaloPost,
  zaloGet,
  sendZaloText,
  sendZaloToGroup,
  getFollowers,
  getUserProfile,
  uploadImageToZalo,
  uploadFileToZalo,
  sendZaloImages,
  sendZaloImagesToGroup,
  sendZaloCard,
  sendZaloImageWithLink,
  sendZaloImageWithLinkToGroup,
  sendZaloFile,
  sendZaloFileToGroup,
  createZaloGroup,
  getGroupMembersV3,
  getPendingGroupMembers,
  acceptGroupJoinRequest,
  rejectGroupJoinRequest,
};
