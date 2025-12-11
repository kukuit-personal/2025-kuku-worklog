'use client'

import { useEffect, useRef, useState } from 'react'
import { Pencil, Trash2, PlusCircle, MoreHorizontal } from 'lucide-react'
import { priorityBgText } from '../utils/priorityColor'
import { fmtDateInput } from '../utils/date'
import { dueDateBgClass } from '../utils/dueColor'
// import { categoryBorderTopClass } from '../utils/stateColor'
import { categoryTagColor } from '../utils/stateColor'
import type { Todo } from '../types'
import { Spinner } from './Spinner'

type SubNewPayload = {
  title: string
  priority: Todo['priority']
  state: Todo['state']
  dueAt: string
}

type Props = {
  item: Todo
  subtasks?: Todo[]
  isSubFormOpen?: boolean
  // actions
  onOpenEdit: (todo: Todo) => void
  onDelete: (id: string) => void
  onToggleSubForm: (id: string, open?: boolean) => void
  onCreateSub: (parentId: string, p: SubNewPayload) => Promise<void>
}

const PRIOS: Todo['priority'][] = ['low', 'normal', 'high', 'urgent', 'critical']
const STATES: Todo['state'][] = [
  'todo',
  'in_progress',
  'waiting',
  'blocked',
  'done',
  'canceled',
  'archived',
]

// Helper: chuyển “in_progress” → “In Progress”
function labelizeWord(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())
}

export default function TodoCard({
  item,
  subtasks = [],
  isSubFormOpen,
  onOpenEdit,
  onDelete,
  onToggleSubForm,
  onCreateSub,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [subMenuOpenId, setSubMenuOpenId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Subtask form state
  const [subTitle, setSubTitle] = useState('')
  const [subPriority, setSubPriority] = useState<Todo['priority']>('normal')
  const [subState, setSubState] = useState<Todo['state']>('todo')
  const [subDue, setSubDue] = useState<string>('')
  const [savingSub, setSavingSub] = useState(false) // Spinner + disable

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node
      if (menuRef.current && !menuRef.current.contains(target)) setMenuOpen(false)
      if (!(target as HTMLElement).closest?.('[data-sub-menu]')) {
        setSubMenuOpenId(null)
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setSubMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [])

  async function handleCreateSub() {
    const t = subTitle.trim()
    if (!t || savingSub) return
    try {
      setSavingSub(true)
      await onCreateSub(item.id, {
        title: t,
        priority: subPriority,
        state: subState,
        dueAt: subDue,
      })
      // reset fields
      setSubTitle('')
      setSubPriority('normal')
      setSubState('todo')
      setSubDue('')
      // 🔹 Ẩn form sau khi thêm xong
      onToggleSubForm(item.id, false)
    } finally {
      setSavingSub(false)
    }
  }

  return (
    <div className="relative rounded-md border border-gray-200 bg-white shadow-sm">
      <div
        className={
          'absolute top-0 h-[8px] w-[100px] rounded-br-md rounded-tl-md ' +
          categoryTagColor(item.category)
        }
      />

      {/* Nội dung card có padding riêng */}
      <div className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
            {item.description ? (
              <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
            ) : null}
          </div>

          {/* Actions menu trigger */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Actions"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => {
                    setMenuOpen(false)
                    onOpenEdit(item)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => {
                    setMenuOpen(false)
                    onDelete(item.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => {
                    setMenuOpen(false)
                    onToggleSubForm(item.id, !isSubFormOpen)
                  }}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add subtask
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {item.category ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-800">
              {item.category}
            </span>
          ) : null}
          {item.state ? (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-800">
              {labelizeWord(item.state)}
            </span>
          ) : null}
          <span className={`rounded-full px-2 py-0.5 ${priorityBgText(item.priority)}`}>
            {labelizeWord(item.priority)}
          </span>
          {item.dueAt ? (
            <span
              className={
                'rounded-full px-2 py-0.5 ' + dueDateBgClass(item.dueAt) // 👈 DÙNG MÀU THEO DUE DATE
              }
            >
              Due {fmtDateInput(item.dueAt)}
            </span>
          ) : null}
        </div>

        {/* Add subtask form */}
        {isSubFormOpen && (
          <div className="mt-1 rounded-md border border-gray-200 p-3">
            <div className="flex flex-col gap-2">
              <input
                value={subTitle}
                onChange={(e) => setSubTitle(e.target.value)}
                placeholder="Subtask title…"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                disabled={savingSub}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={subState}
                  onChange={(e) => setSubState(e.target.value as Todo['state'])}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                  disabled={savingSub}
                >
                  {STATES.map((st) => (
                    <option key={st} value={st}>
                      {labelizeWord(st)}
                    </option>
                  ))}
                </select>

                <select
                  value={subPriority}
                  onChange={(e) => setSubPriority(e.target.value as Todo['priority'])}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                  disabled={savingSub}
                >
                  {PRIOS.map((p) => (
                    <option key={p} value={p}>
                      {labelizeWord(p)}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={subDue}
                  onChange={(e) => setSubDue(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                  disabled={savingSub}
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => onToggleSubForm(item.id, false)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
                  disabled={savingSub}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSub}
                  className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                  disabled={savingSub}
                >
                  {savingSub ? (
                    <Spinner className="h-4 w-4 text-white" />
                  ) : (
                    <PlusCircle className="h-4 w-4" />
                  )}
                  {savingSub ? 'Adding…' : 'Add subtask'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Subtasks list */}
        {subtasks.length > 0 && (
          <ul className="mt-1 space-y-2">
            {subtasks.map((s, i) => {
              const zebra = i % 2 === 0 ? 'bg-gray-100' : 'bg-white'
              return (
                <li key={s.id} className={`rounded-md border border-gray-200 p-3 ${zebra}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-gray-900 break-words">{s.title}</div>
                      {/* badges: state → priority → due */}
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                        {s.state ? (
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-800">
                            {labelizeWord(s.state)}
                          </span>
                        ) : null}
                        <span className={`rounded-full px-2 py-0.5 ${priorityBgText(s.priority)}`}>
                          {labelizeWord(s.priority)}
                        </span>
                        {s.dueAt ? (
                          <span
                            className={
                              'rounded-full px-2 py-0.5 ' + dueDateBgClass(s.dueAt) // 👈 ÁP DỤNG CHO SUBTASK
                            }
                          >
                            Due {fmtDateInput(s.dueAt)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Subtask actions: menu ... */}
                    <div className="relative" data-sub-menu>
                      <button
                        type="button"
                        onClick={() => setSubMenuOpenId((prev) => (prev === s.id ? null : s.id))}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-200"
                        aria-label="Subtask actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

                      {subMenuOpenId === s.id && (
                        <div className="absolute right-0 z-20 mt-2 w-36 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                            onClick={() => {
                              setSubMenuOpenId(null)
                              onOpenEdit(s)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                            onClick={() => {
                              setSubMenuOpenId(null)
                              onDelete(s.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
