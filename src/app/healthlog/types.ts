// components/healthlog.types.ts
export type Status = 'active' | 'disabled'
export type FilterMode = 'last7' | 'last30' | 'thisMonth' | 'all'

export type HealthLog = {
  id: string
  date: string
  weekday?: string | null
  weight?: string | null
  morning?: string | null
  gym?: string | null
  afternoon?: string | null
  noEatAfter?: string | null
  calories?: number | null
  goutTreatment?: number | null
  status: Status
  createdAt: string
  updatedAt: string
}

export type HealthLogProps = {
  items: HealthLog[]
  isLoading: boolean
  total: number
  page: number
  setPage: (n: number | ((p: number) => number)) => void
  pageSize: number
  setPageSize: (n: number) => void
  filterMode: FilterMode
  setFilterMode: (m: FilterMode) => void
  menuOpenId: string | null
  setMenuOpenId: (id: string | null | ((v: string | null) => string | null)) => void
  openEdit: (item: HealthLog) => void
  deleteItem: (id: string) => void
}
