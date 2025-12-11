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

export default function HealthLogTableDesktop({
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
    <>
      {/* Controls */}
      <div className="mb-2 flex flex-wrap items-center gap-2 px-3 sm:px-4 pt-3">
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

        <span className="hidden sm:inline-block w-px h-5 bg-gray-200 mx-1" />

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

      {/* Table (không còn overflow-x) */}
      <div className="relative">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-4 py-2 text-left left-0 bg-gray-50">Date</th>
              <th className="px-3 sm:px-4 py-2 text-right">Weight</th>
              <th className="px-3 sm:px-4 py-2 text-left">Morning</th>
              <th className="px-3 sm:px-4 py-2 text-left">Gym</th>
              <th className="px-3 sm:px-4 py-2 text-left">Afternoon</th>
              <th className="px-3 sm:px-4 py-2 text-left">NoEat18:30</th>
              <th className="px-3 sm:px-4 py-2 text-right">Kcal</th>
              <th className="px-3 sm:px-4 py-2 text-right">Gout</th>
              <th className="px-3 sm:px-4 py-2 text-right right-0 bg-gray-50 border-l w-12">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={9} className="py-6 text-center text-gray-500">
                  <Spinner className="w-4 h-4 inline mr-2" /> Loading…
                </td>
              </tr>
            )}

            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={9} className="py-6 text-center text-gray-500">
                  No records.
                </td>
              </tr>
            )}

            {!isLoading &&
              items.map((it, idx) => {
                const wd = weekdayOf(it.date)
                const wdShort = wdAbbr(wd)
                const isSun = wd === 'Sun'
                const stripe = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                const rowTone = it.status === 'disabled' ? 'bg-gray-100 text-gray-500' : stripe
                const stickyLeftBg = it.status === 'disabled' ? 'bg-gray-100' : stripe
                const isMenuOpen = menuOpenId === it.id

                return (
                  <tr
                    key={it.id}
                    className={[rowTone, isSun ? 'border-t border-red-500' : 'border-t'].join(' ')}
                  >
                    <td
                      className={[
                        'px-3 sm:px-4 py-1 sticky left-0 z-10',
                        isSun ? 'text-red-600 font-bold' : '',
                        stickyLeftBg,
                      ].join(' ')}
                      title={wd}
                    >
                      {it.date ? `${it.date}(${wdShort})` : ''}
                    </td>

                    <td className="px-3 sm:px-4 py-1 text-right">
                      {it.weight ? Number(it.weight).toFixed(2) : ''}
                    </td>

                    <td className={`px-3 sm:px-4 py-1 ${it.morning ? 'bg-green-300' : ''}`}>
                      {shorten(it.morning, 18)}
                    </td>
                    <td className={`px-3 sm:px-4 py-1 ${it.gym ? 'bg-green-300' : ''}`}>
                      {shorten(it.gym, 18)}
                    </td>
                    <td className={`px-3 sm:px-4 py-1 ${it.afternoon ? 'bg-green-300' : ''}`}>
                      {shorten(it.afternoon, 18)}
                    </td>
                    <td className={`px-3 sm:px-4 py-1 ${it.noEatAfter ? 'bg-green-300' : ''}`}>
                      {shorten(it.noEatAfter, 10)}
                    </td>
                    <td className={`px-3 sm:px-4 py-1 text-right ${kcalBgClass(it.calories)}`}>
                      {it.calories ?? ''}
                    </td>
                    <td className={`px-3 sm:px-4 py-1 text-right ${goutBgClass(it.goutTreatment)}`}>
                      {it.goutTreatment ?? ''}
                    </td>

                    {/* Actions */}
                    <td
                      data-row-menu
                      className="px-3 sm:px-4 py-1 text-right right-0 bg-white border-l relative"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpenId((v) => (v === it.id ? null : it.id))
                        }}
                        className="inline-grid place-items-center w-7 h-7 rounded hover:bg-gray-100"
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                        aria-label="Open row menu"
                      >
                        <DotsIcon />
                      </button>

                      {isMenuOpen && (
                        <div
                          role="menu"
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-2 top-full mt-2 z-50 w-36 rounded-md border bg-white shadow-lg py-1 text-sm"
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
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 text-sm text-gray-600">
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
    </>
  )
}
