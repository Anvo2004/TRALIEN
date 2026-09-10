import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
}

export function formatDateShort(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
}

const AVATAR_PALETTE = [
  'from-blue-500 to-indigo-400',
  'from-purple-500 to-violet-400',
  'from-amber-500 to-orange-400',
  'from-rose-500 to-pink-400',
  'from-cyan-500 to-sky-400',
  'from-indigo-500 to-blue-400',
  'from-teal-500 to-emerald-400',
  'from-fuchsia-500 to-pink-400',
]

// Màu avatar ổn định theo seed (vd. userId) — cùng 1 người luôn ra cùng 1 màu
export function getAvatarColor(seed = '') {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}
