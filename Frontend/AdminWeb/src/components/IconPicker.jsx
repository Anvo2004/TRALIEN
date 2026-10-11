import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Loader2, Search, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

// Chọn ảnh icon 3D cho một mục AppLink: lấy lại ảnh đã có trong thư viện
// (collection AppIcon) hoặc tải ảnh mới lên. Thay cho ô gõ tay tên icon —
// gõ sai tên thì MiniApp hiện ô trắng mà không báo lỗi gì.
export default function IconPicker({ value, onChange }) {
  const queryClient = useQueryClient()
  const fileRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['app-icons'],
    queryFn: () => api.get('/api/app-icons').then((r) => r.data),
    enabled: open,
  })

  const uploadMutation = useMutation({
    mutationFn: (file) => {
      const body = new FormData()
      body.append('file', file)
      return api.post('/api/app-icons/upload', body).then((r) => r.data)
    },
    onSuccess: (res) => {
      toast.success('Đã tải ảnh lên')
      onChange(res.item.url)
      queryClient.invalidateQueries({ queryKey: ['app-icons'] })
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi tải ảnh'),
  })

  const items = data?.items ?? []
  const keyword = search.trim().toLowerCase()
  const filtered = keyword
    ? items.filter((it) => `${it.label} ${it.key} ${it.group}`.toLowerCase().includes(keyword))
    : items

  function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) uploadMutation.mutate(file)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 shrink-0 rounded-xl border bg-gray-50 flex items-center justify-center overflow-hidden">
          {value ? (
            <img src={value} alt="" className="h-11 w-11 object-contain" />
          ) : (
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? 'Đóng thư viện' : 'Chọn từ thư viện'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
            Tải ảnh lên
          </Button>
          {value && (
            <Button type="button" variant="outline" size="sm" className="text-destructive" onClick={() => onChange('')}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Bỏ ảnh
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/webp"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      </div>

      {open && (
        <div className="rounded-xl border p-3 space-y-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm icon theo tên..."
              className="pl-9 h-9"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {items.length === 0
                ? 'Thư viện trống — chạy scripts/seed-app-icons.js hoặc tải ảnh lên.'
                : 'Không có icon nào khớp từ khoá.'}
            </p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-72 overflow-y-auto">
              {filtered.map((it) => (
                <button
                  key={it._id}
                  type="button"
                  title={`${it.label}${it.group ? ` · ${it.group}` : ''}`}
                  onClick={() => { onChange(it.url); setOpen(false) }}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors hover:bg-gray-50 ${
                    value === it.url ? 'border-primary bg-primary/5' : 'border-input'
                  }`}
                >
                  <img src={it.url} alt="" className="h-9 w-9 object-contain" />
                  <span className="text-[10px] leading-tight text-center text-muted-foreground line-clamp-2">
                    {it.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
