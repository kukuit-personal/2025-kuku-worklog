'use client'

import React from 'react'
import { Spinner } from './Spinner'
import type { HealthLogProps } from '../types'

function shorten(s?: string | null, n = 18) {
  if (!s) return ''
  return s.length > n ? s.slice(0, n) + '…' : s
}
function weekdayOf(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Ho_Chi_Minh' })
}
function wdAbbr(w: string) {
  const map: Record<string, string> = {
    Sun: 'Su',
    Mon: 'Mo',
    Tue: 'Tu',
    Wed: 'We',
    Thu: 'Th',
    Fri: 'Fr',
    Sat: 'Sa',
  }
  return map[w] ?? w
}
function kcalBgClass(k?: number | null) {
  if (k == null) return 'bg-white'
  if (k >= 2500) return 'bg-orange-800'
  if (k >= 2000) return 'bg-orange-600'
  if (k >= 1600) return 'bg-orange-500'
  if (k >= 1200) return 'bg-orange-400'
  if (k >= 1000) return 'bg-orange-300'
  return 'bg-white'
}
function goutBgClass(g?: number | null) {
  if (g == null) return 'bg-white'
  const v = Math.max(0, Math.min(8, Math.floor(g)))
  if (v === 0) return 'bg-white'
  const shades = [
    'bg-green-100',
    'bg-green-200',
    'bg-green-300',
    'bg-green-400',
    'bg-green-500',
    'bg-green-600',
    'bg-green-700',
    'bg-green-800',
  ]
  return shades[v - 1]
}
function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-600">
      <path
        fill="currentColor"
        d="M12 8a2 2 0 1 0 0-4a2 2 0 0 0 0 4m0 6a2 2 0 1 0 0-4a2 2 0 0 0 0 4m0 6a2 2 0 1 0 0-4a2 2 0 0 0 0 4"
      />
    </svg>
  )
}
function EditIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm14.71-9.04c.39-.39.39-1.02 0-1.41l-2.51-2.51a.9959.9959 0 1 0-1.41 1.41l2.51 2.51c.4.39 1.03.39 1.41 0Z"
      />
    </svg>
  )
}
function TrashIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path fill="currentColor" d="M9 3h6v2h5v2H4V5h5zm1 6h2v8h-2zm4 0h2v8h-2z" />
    </svg>
  )
}

function Chip({
  label,
  value,
  extraClass = '',
}: {
  label: string
  value: any
  extraClass?: string
}) {
  const filled = String(value || '').trim().length > 0
  return (
    <div
      className={[
        'px-1.5 py-1 rounded border max-w-full',
        filled ? 'bg-green-300' : 'bg-white',
        extraClass,
      ].join(' ')}
    >
      <div className="text-[10px] uppercase text-gray-500">{label}</div>
      <div className="text-sm truncate" title={String(value || '')}>
        {shorten(String(value || ''), 20)}
      </div>
    </div>
  )
}

export default function HealthLogListMobile({
  items,
  isLoading,
  total,
  page,
  setPage,
  pageSize,
  setPageSize,
  filterMode,
  setFilterMode,
  menuOpenId,
  setMenuOpenId,
  openEdit,
  deleteItem,
}: HealthLogProps) {
  const maxPage = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="px-3 sm:px-4 pt-3">
      {/* Controls */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="text-sm text-gray-600">View:</label>
        <select
          value={filterMode}
          onChange={(e) => {
            setPage(1)
            setFilterMode(e.target.value as any)
          }}
          className="px-3 py-1.5 rounded-md border text-sm"
        >
          <option value="last7">Last 7 days</option>
          <option value="last30">Last 30 days</option>
          <option value="thisMonth">This month</option>
          <option value="all">All</option>
        </select>
        <span className="inline-block w-px h-5 bg-gray-200 mx-1" />
        <label className="text-sm text-gray-600">Page size:</label>
        <select
          value={pageSize}
          onChange={(e) => {
            setPage(1)
            setPageSize(Number(e.target.value))
          }}
          className="px-3 py-1.5 rounded-md border text-sm"
        >
          <option value={10}>10</option>
          <option value={30}>30</option>
          <option value={50}>50</option>
        </select>
      </div>

      {/* List */}
      {isLoading && (
        <div className="py-6 text-center text-gray-500">
          <Spinner className="w-4 h-4 inline mr-2" /> Loading…
        </div>
      )}
      {!isLoading && items.length === 0 && (
        <div className="py-6 text-center text-gray-500">No records.</div>
      )}

      {!isLoading &&
        items.map((it, idx) => {
          const wd = weekdayOf(it.date)
          const wdShort = wdAbbr(wd)
          const isSun = wd === 'Sun'
          const isMenuOpen = menuOpenId === it.id
          const zebra = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'

          return (
            <div
              key={it.id}
              data-row-menu
              className={['mb-2 rounded-md border p-3 shadow-sm relative', zebra].join(' ')}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <div
                  className={['font-medium', isSun ? 'text-red-600' : 'text-gray-900'].join(' ')}
                >
                  {it.date ? `${it.date}(${wdShort})` : ''}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-700">
                    {it.weight ? Number(it.weight).toFixed(2) : ''}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpenId((v) => (v === it.id ? null : it.id))
                    }}
                    className="inline-grid place-items-center w-9 h-9 rounded hover:bg-gray-100"
                    aria-haspopup="menu"
                    aria-expanded={isMenuOpen}
                    aria-label="Open row menu"
                  >
                    <DotsIcon />
                  </button>
                </div>
              </div>

              {/* Chips – luôn hiện, tự wrap nếu dài */}
              <div className="mt-2">
                <div className="flex flex-wrap gap-2">
                  <Chip label="Mor" value={it.morning} />
                  <Chip label="Gym" value={it.gym} />
                  <Chip label="Atn" value={it.afternoon} />
                  <Chip label="Noe" value={it.noEatAfter} />
                  <Chip
                    label="Kcl"
                    value={it.calories ?? ''}
                    extraClass={kcalBgClass(it.calories)}
                  />
                  <Chip
                    label="Gut"
                    value={it.goutTreatment ?? ''}
                    extraClass={goutBgClass(it.goutTreatment)}
                  />
                </div>
              </div>

              {/* Popover menu */}
              {isMenuOpen && (
                <div
                  role="menu"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-[42px] z-40 w-40 rounded-md border bg-white shadow-lg py-1 text-sm"
                >
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenuOpenId(null)
                      openEdit(it)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50"
                  >
                    <EditIcon className="w-4 h-4" /> Edit
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => deleteItem(it.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-red-600"
                  >
                    <TrashIcon className="w-4 h-4" /> Delete
                  </button>
                </div>
              )}
            </div>
          )
        })}

      {/* Pagination */}
      <div className="mt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-600">
        <div>
          {total > 0 ? (
            <>
              Showing{' '}
              <strong>
                {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)}
              </strong>{' '}
              of <strong>{total}</strong>
            </>
          ) : (
            'No records'
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-md border hover:bg-gray-50 disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page <strong>{page}</strong> / {maxPage}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, maxPage))}
            disabled={page >= maxPage || total === 0}
            className="px-3 py-1.5 rounded-md border hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
