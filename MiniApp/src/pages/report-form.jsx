import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page, Header, Box } from "zmp-ui";
import { getUserInfo, chooseImage } from "zmp-sdk/apis";
import API_BASE_URL from "../data/api-config.js";

const PHONE_RE = /^(0|\+84)[3-9]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_IMAGES = 5;

// Toạ độ lấy qua Web Geolocation chuẩn (navigator.geolocation) — chạy được
// ngay trong webview Mini App, không cần xin quyền userLocation riêng từ Zalo
// và test được cả trên Simulator (khác với zmp-sdk's getLocation(), API đó chỉ
// trả token cần đổi qua Backend và luôn rỗng ở môi trường dev).
function detectLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Trình duyệt không hỗ trợ định vị"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("Không lấy được vị trí")),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// Dịch toạ độ → địa chỉ đọc được qua Backend (KHÔNG gọi Nominatim thẳng từ
// đây — WebView Zalo Mini App thật chỉ cho fetch tới domain đã khai báo,
// xem comment ở route /api/public/reverse-geocode phía Backend).
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/public/reverse-geocode?lat=${lat}&lng=${lng}`
    );
    const data = await res.json();
    return data.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

const ReportFormPage = () => {
  const navigate = useNavigate();
  const [zaloUser, setZaloUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [contact, setContact] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState(null); // { lat, lng } | null
  const [locationMode, setLocationMode] = useState(""); // "" | "auto" | "manual"
  const [locationLoading, setLocationLoading] = useState(false);
  const [images, setImages] = useState([]); // [{ previewUrl }]
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    getUserInfo({ autoRequestPermission: true })
      .then(({ userInfo }) => setZaloUser(userInfo))
      .catch(() => setZaloUser(null));

    fetch(`${API_BASE_URL}/api/public/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  const handleChooseImage = async () => {
    if (images.length >= MAX_IMAGES) return;
    try {
      const { filePaths } = await chooseImage({ count: MAX_IMAGES - images.length });
      setImages((prev) => [...prev, ...filePaths.map((url) => ({ previewUrl: url }))].slice(0, MAX_IMAGES));
    } catch (err) {
      // user cancelled the picker — not an error worth surfacing
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAutoLocation = async () => {
    setLocationLoading(true);
    setError("");
    try {
      const { lat, lng } = await detectLocation();
      setCoords({ lat, lng });
      const addr = await reverseGeocode(lat, lng);
      setAddress(addr);
      setLocationMode("auto");
    } catch (err) {
      setLocationMode("manual");
      setError("Không lấy được vị trí tự động. Vui lòng nhập tay bên dưới.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleManualMode = () => {
    setLocationMode("manual");
    setCoords(null);
    setAddress("");
  };

  const clearLocation = () => {
    setLocationMode("");
    setCoords(null);
    setAddress("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!zaloUser?.id) {
      setError("Không lấy được thông tin tài khoản Zalo. Vui lòng thử lại.");
      return;
    }
    const trimmedContact = contact.trim();
    if (!PHONE_RE.test(trimmedContact) && !EMAIL_RE.test(trimmedContact)) {
      setError("Số điện thoại hoặc email không hợp lệ.");
      return;
    }
    if (content.trim().length < 5) {
      setError("Nội dung phải có ít nhất 5 ký tự.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("userId", zaloUser.id);
      formData.append("displayName", zaloUser.name || "");
      formData.append("contact", trimmedContact);
      if (title.trim()) formData.append("title", title.trim());
      formData.append("content", content.trim());
      if (categoryId) formData.append("categoryId", categoryId);
      if (address.trim()) formData.append("address", address.trim());
      if (coords) {
        formData.append("lat", coords.lat);
        formData.append("lng", coords.lng);
      }

      for (const img of images) {
        const blob = await fetch(img.previewUrl).then((r) => r.blob());
        formData.append("images", blob, "photo.jpg");
      }

      const res = await fetch(`${API_BASE_URL}/api/public/feedbacks`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gửi phản ánh thất bại");

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCategoryId("");
    setContact("");
    setTitle("");
    setContent("");
    setAddress("");
    setCoords(null);
    setLocationMode("");
    setImages([]);
    setError("");
    setSubmitted(false);
  };

  if (submitted) {
    const selectedCategory = categories.find((cat) => cat._id === categoryId);
    return (
      <Page className="page-report-form">
        <Header title="Phản ánh - Kiến nghị" />
        <div className="report-success">
          <div className="report-success__banner">
            <div className="report-success__banner-icon">✅</div>
            <div className="report-success__banner-title">Đã tiếp nhận phản ánh</div>
            <div className="report-success__banner-desc">
              Mã tra cứu do hệ thống 1022 cấp sẽ được nhắn cho bạn qua Zalo ngay khi tiếp nhận,
              cùng phản hồi của UBND xã Trà Liên.
            </div>
          </div>

          <div className="report-success__card">
            <div className="report-success__card-title">📋 THÔNG TIN GÓP Ý</div>

            <div className="report-success__row">
              <span className="report-success__row-label">🆔 Mã phản ánh</span>
              <span className="report-success__row-value report-success__row-value--pending">
                Sẽ gửi qua Zalo
              </span>
            </div>

            <div className="report-success__row">
              <span className="report-success__row-label">📞 Liên hệ</span>
              <span className="report-success__row-value">{contact}</span>
            </div>

            {selectedCategory && (
              <div className="report-success__row">
                <span className="report-success__row-label">🏷️ Loại góp ý</span>
                <span className="report-success__row-value">
                  {selectedCategory.icon} {selectedCategory.name}
                </span>
              </div>
            )}

            <div className="report-success__row report-success__row--block">
              <span className="report-success__row-label">💬 Nội dung</span>
              <p className="report-success__row-text">{content}</p>
            </div>

            {address && (
              <div className="report-success__row report-success__row--block">
                <span className="report-success__row-label">📍 Địa chỉ</span>
                <p className="report-success__row-text">{address}</p>
              </div>
            )}

            {images.length > 0 && (
              <div className="report-success__row">
                <span className="report-success__row-label">🖼️ Hình ảnh</span>
                <span className="report-success__row-value">{images.length} ảnh đính kèm</span>
              </div>
            )}
          </div>

          <div className="report-success__thanks">
            🙏 Cảm ơn bạn đã tin tưởng gửi phản ánh tới UBND xã Trà Liên!
          </div>

          <button
            type="button"
            className="report-success__track"
            onClick={() => navigate("/phan-anh-cua-toi")}
          >
            📋 Theo dõi phản ánh của tôi
          </button>

          <button type="button" className="report-success__again" onClick={resetForm}>
            Gửi phản ánh khác
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page className="page-report-form">
      <Header title="Phản ánh - Kiến nghị" />
      <Box className="section">
        <form className="report-form" onSubmit={handleSubmit}>
          <label>
            🏷️ Lĩnh vực
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">-- Chọn lĩnh vực --</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            📞 Số điện thoại hoặc email *
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="0912345678 hoặc email@example.com"
              required
            />
          </label>

          <label>
            📌 Tiêu đề (tùy chọn)
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Phản ánh đèn đường hỏng tại thôn..."
              maxLength={120}
            />
          </label>

          <label>
            💬 Nội dung phản ánh *
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Mô tả chi tiết vấn đề bạn muốn phản ánh..."
              required
            />
          </label>

          <div className="report-form__location">
            <div className="report-form__location-label">📍 Địa chỉ (tùy chọn)</div>

            {locationMode === "" && (
              <div className="report-form__location-buttons">
                <button
                  type="button"
                  className="report-form__location-btn"
                  onClick={handleAutoLocation}
                  disabled={locationLoading}
                >
                  {locationLoading ? "Đang lấy vị trí..." : "📍 Lấy vị trí tự động"}
                </button>
                <button
                  type="button"
                  className="report-form__location-btn"
                  onClick={handleManualMode}
                >
                  ✏️ Nhập địa chỉ
                </button>
              </div>
            )}

            {locationMode !== "" && (
              <div className="report-form__location-result">
                <input
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setLocationMode("manual");
                  }}
                  placeholder="Số nhà, thôn, xã Trà Liên..."
                />
                {coords && (
                  <div className="report-form__location-gps">
                    GPS: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </div>
                )}
                <button
                  type="button"
                  className="report-form__location-clear"
                  onClick={clearLocation}
                >
                  Xoá địa chỉ
                </button>
              </div>
            )}
          </div>

          <div className="report-form__images">
            <div className="report-form__images-label">📷 Hình ảnh (tối đa {MAX_IMAGES})</div>
            <div className="report-form__images-grid">
              {images.map((img, index) => (
                <div key={img.previewUrl} className="report-form__image-item">
                  <img src={img.previewUrl} alt="Ảnh đính kèm" />
                  <button type="button" onClick={() => removeImage(index)}>
                    ✕
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button type="button" className="report-form__add-image" onClick={handleChooseImage}>
                  +
                </button>
              )}
            </div>
          </div>

          {error && <div className="report-form__error">{error}</div>}

          <button type="submit" className="report-form__submit" disabled={submitting}>
            {submitting ? "Đang gửi..." : "Gửi phản ánh"}
          </button>
        </form>
      </Box>
    </Page>
  );
};

export default ReportFormPage;
