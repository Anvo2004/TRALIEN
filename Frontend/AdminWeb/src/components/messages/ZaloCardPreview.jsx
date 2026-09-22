import { ImageOff } from 'lucide-react'

// Cắt giống Backend (services/newsCardService.js) để xem trước đúng nội dung sẽ gửi.
function truncate(str, max) {
  const s = (str || '').replace(/\s+/g, ' ').trim()
  return s.length > max ? `${s.slice(0, max - 1).trim()}…` : s
}

// Mô phỏng thẻ tin (list template 1 phần tử) như Zalo hiển thị trong khung chat
// OA: ảnh lớn, tiêu đề đậm, mô tả xám.
export default function ZaloCardPreview({ title, summary, imageUrl }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-4">
      <div className="mx-auto max-w-[320px] overflow-hidden rounded-xl bg-white shadow-sm">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="aspect-[16/9] w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-1 bg-slate-50 text-xs text-slate-400">
            <ImageOff className="h-5 w-5" /> Chưa có ảnh (dùng ảnh bìa mặc định nếu có)
          </div>
        )}
        <div className="p-3">
          <p className="line-clamp-3 text-[15px] font-semibold leading-snug text-slate-800">
            {truncate(title, 100)}
          </p>
          <p className="mt-1 line-clamp-2 text-sm leading-snug text-slate-500">
            {truncate(summary || title, 255)}
          </p>
        </div>
      </div>
    </div>
  )
}
