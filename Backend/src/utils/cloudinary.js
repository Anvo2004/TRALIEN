const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;
const config = require("../config");

// ============================================================
// Upload ảnh, hai tầng — cùng pattern với utils/rateLimit.js:
//   1. Cloudinary — dùng khi có đủ cấu hình (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET).
//   2. Lưu thẳng ra đĩa VPS (Backend/public/images/<folder>/), phục vụ qua
//      express.static tại /images (xem src/app.js) — dùng khi thiếu cấu hình
//      Cloudinary. Không có CDN/resize như Cloudinary, nhưng đủ dùng cho quy
//      mô 1 xã và không cần thêm tài khoản ngoài.
// ============================================================

const isCloudinaryConfigured = Boolean(
  config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}

const PUBLIC_IMAGES_DIR = path.join(__dirname, "..", "..", "public", "images");

async function uploadToLocalDisk(buffer, folder) {
  const dir = path.join(PUBLIC_IMAGES_DIR, folder);
  await fs.promises.mkdir(dir, { recursive: true });

  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.jpg`;
  await fs.promises.writeFile(path.join(dir, filename), buffer);

  const publicPath = `/images/${folder}/${filename}`;
  return { secure_url: `${config.publicUrl}${publicPath}`, path: publicPath };
}

function uploadFromBuffer(buffer, folder) {
  return isCloudinaryConfigured ? uploadToCloudinary(buffer, folder) : uploadToLocalDisk(buffer, folder);
}

module.exports = { cloudinary, uploadFromBuffer, isCloudinaryConfigured };
