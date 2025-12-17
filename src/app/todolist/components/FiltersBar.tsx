'use client'

import { useEffect, useMemo, useState } from 'react'
import { CATES, FilterMode, PRIOS, STATES, TodoCategory, TodoPriority, TodoState } from '../types'
import { MultiSelect, Option } from './MultiSelect'
import { SlidersHorizontal } from 'lucide-react'

export function FiltersBar({
  filters,
  setFilters,
  pageSize,
  setPageSize,
  setPage,
  onChangePageSize,
  // NEW
  todayTaskOn,
  onToggleTodayTask,
}: {
  filters: FilterMode
  setFilters: (updater: any) => void
  pageSize: number
  setPageSize: (n: number) => void
  setPage: (n: number) => void
  onChangePageSize?: (n: number) => void

  // NEW
  todayTaskOn?: boolean
  onToggleTodayTask?: () => void
}) {
  // ===== Local filter states =====
  const [states, setStates] = useState<TodoState[]>(filters.states)
  const [cateAll, setCateAll] = useState(filters.categories === 'all')
  const [categories, setCategories] = useState<TodoCategory[]>(
    filters.categories === 'all' ? [] : (filters.categories as TodoCategory[])
  )
  const [prioAll, setPrioAll] = useState(filters.priorities === 'all')
  const [priorities, setPriorities] = useState<TodoPriority[]>(
    filters.priorities === 'all' ? [] : (filters.priorities as TodoPriority[])
  )

  // toggle show/hide filter panel
  const [showFilters, setShowFilters] = useState(false)

  // Sync lại nếu filters ngoài thay đổi
  useEffect(() => {
    setStates(filters.states)
    setCateAll(filters.categories === 'all')
    setCategories(filters.categories === 'all' ? [] : (filters.categories as TodoCategory[]))
    setPrioAll(filters.priorities === 'all')
    setPriorities(filters.priorities === 'all' ? [] : (filters.priorities as TodoPriority[]))
  }, [filters])

  const cateOpts: Option[] = useMemo(() => CATES.map((c) => ({ value: c, label: c })), [])
  const stateOpts: Option[] = useMemo(() => STATES.map((s) => ({ value: s, label: s })), [])
  const prioOpts: Option[] = useMemo(() => PRIOS.map((p) => ({ value: p, label: p })), [])

  function apply() {
    setPage(1)
    setFilters((f: FilterMode) => ({
      ...f,
      states,
      categories: cateAll ? 'all' : categories,
      priorities: prioAll ? 'all' : priorities,
    }))
  }

  function handleChangePageSize(n: number) {
    if (typeof onChangePageSize === 'function') {
      onChangePageSize(n)
    } else {
      setPageSize(n)
      setPage(1)
    }
  }

  return (
    <div className="mb-3">
      {/* Header với nút Show Filter */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm bg-white hover:bg-gray-50"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {/* NEW: Today task */}
          <button
            type="button"
            onClick={() => onToggleTodayTask?.()}
            className={
              'inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm ' +
              (todayTaskOn ? 'bg-gray-900 text-white border-gray-900' : 'bg-white hover:bg-gray-50')
            }
            title="Only urgent & critical"
          >
            Today task
          </button>
        </div>
      </div>

      {/* Panel filter */}
      {showFilters && (
        <div className="rounded-lg border bg-white p-3 sm:p-4 flex flex-col gap-4">
          {/* Hàng 1: Category - State - Priority */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {/* Category */}
            <div className="min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <MultiSelect
                placeholder="Select categories"
                options={cateOpts}
                value={cateAll ? 'all' : categories}
                onChange={(v) => {
                  if (v === 'all') {
                    setCateAll(true)
                    setCategories([])
                  } else {
                    setCateAll(false)
                    setCategories(v as TodoCategory[])
                  }
                }}
                allEnabled
                allLabel="All"
              />
            </div>

            {/* State */}
            <div className="min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <MultiSelect
                placeholder="Select states"
                options={stateOpts}
                value={states}
                onChange={(v) => setStates(Array.isArray(v) ? (v as TodoState[]) : [])}
              />
            </div>

            {/* Priority */}
            <div className="min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <MultiSelect
                placeholder="Select priorities"
                options={prioOpts}
                value={prioAll ? 'all' : priorities}
                onChange={(v) => {
                  if (v === 'all') {
                    setPrioAll(true)
                    setPriorities([])
                  } else {
                    setPrioAll(false)
                    setPriorities(v as TodoPriority[])
                  }
                }}
                allEnabled
                allLabel="All"
              />
            </div>
          </div>

          {/* Hàng 2: Page size + Apply */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 border-t pt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page size</label>
              <select
                value={pageSize}
                onChange={(e) => handleChangePageSize(Number(e.target.value))}
                className="px-3 py-1.5 rounded-md border text-sm bg-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="md:ml-auto">
              <button
                onClick={apply}
                className="px-4 py-2 rounded-md border border-indigo-600 bg-indigo-500 text-white text-sm hover:bg-indigo-600"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
