// utils/dueColor.ts

export function dueDateBgClass(dueAt?: string | Date | null): string {
  if (!dueAt) return ''

  const raw = typeof dueAt === 'string' ? new Date(dueAt) : dueAt
  if (isNaN(raw.getTime())) return ''

  // Chuẩn hoá về 00:00:00 cho CẢ hai bên (chỉ so sánh theo ngày)
  const today = new Date()
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const dueDate = new Date(raw.getFullYear(), raw.getMonth(), raw.getDate())

  const dayMs = 24 * 60 * 60 * 1000
  const diffDays = Math.round((dueDate.getTime() - todayDate.getTime()) / dayMs)
  // diffDays:
  //   < 0 : quá hạn
  //   = 0 : hôm nay
  //   > 0 : còn diffDays ngày nữa

  // 1) Quá hạn HOẶC hôm nay → đỏ
  if (diffDays <= 0) {
    return 'bg-[rgb(240,102,51)] text-white'
  }

  // 2) Còn trong vòng 3 ngày → cam đậm
  if (diffDays <= 3) {
    return 'bg-red-100 text-red-800'
  }

  // 3) Còn xa hơn 3 ngày → vàng nhạt
  return 'bg-amber-100 text-amber-900'
}
