'use client'

import { STATES, CATES, PRIOS, Status, Todo, TodoCategory, TodoPriority, TodoState } from '../types'
import { Spinner } from './Spinner'
import { SaveIcon } from './icons'

const STATE_OPTIONS: { val: TodoState; label: string }[] = [
  { val: 'todo', label: 'To Do' },
  { val: 'in_progress', label: 'In Progress' },
  { val: 'waiting', label: 'Waiting' },
  { val: 'blocked', label: 'Blocked' },
  { val: 'done', label: 'Done' },
  { val: 'canceled', label: 'Canceled' },
  { val: 'archived', label: 'Archived' },
]

const STATUS_OPTIONS: { val: Status; label: string }[] = [
  { val: 'active', label: 'Active' },
  { val: 'disabled', label: 'Disabled' },
]

export function EditModal({
  open,
  editing,
  editForm,
  setEditForm,
  onClose,
  onSave,
  saving,
}: {
  open: boolean
  editing: Todo | null
  editForm: {
    title: string
    description: string
    category: TodoCategory
    priority: TodoPriority
    state: TodoState
    dueAt: string
    status: Status
  }
  setEditForm: (updater: any) => void
  onClose: () => void
  onSave: () => void
  saving: boolean
}) {
  if (!open || !editing) return null

  return (
    <div
      className="fixed inset-0 z-30 bg-black/30 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-lg border p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Edit todo</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 inline-grid place-items-center rounded hover:bg-gray-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 sm:gap-4">
          {/* Title */}
          <div className="col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              value={editForm.title}
              onChange={(e) => setEditForm((f: any) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-md border px-3 py-1.5 text-sm"
            />
          </div>

          {/* Description */}
          <div className="col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              value={editForm.description}
              onChange={(e) => setEditForm((f: any) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-md border px-3 py-1.5 text-sm"
            />
          </div>

          {/* Category */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={editForm.category}
              onChange={(e) => setEditForm((f: any) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-md border px-3 py-1.5 text-sm"
            >
              {CATES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* State */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select
              value={editForm.state}
              onChange={(e) => setEditForm((f: any) => ({ ...f, state: e.target.value }))}
              className="w-full rounded-md border px-3 py-1.5 text-sm"
            >
              {STATE_OPTIONS.map((s) => (
                <option key={s.val} value={s.val}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={editForm.priority}
              onChange={(e) => setEditForm((f: any) => ({ ...f, priority: e.target.value }))}
              className="w-full rounded-md border px-3 py-1.5 text-sm"
            >
              {PRIOS.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Due date */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
            <input
              type="date"
              value={editForm.dueAt}
              onChange={(e) => setEditForm((f: any) => ({ ...f, dueAt: e.target.value }))}
              className="w-full rounded-md border px-3 py-1.5 text-sm"
            />
          </div>

          {/* Status */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm((f: any) => ({ ...f, status: e.target.value }))}
              className="w-full rounded-md border px-3 py-1.5 text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.val} value={s.val}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-blue-600 bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 disabled:opacity-60 text-sm"
          >
            {saving ? <Spinner className="w-4 h-4 text-white" /> : <SaveIcon />}
            <span>{saving ? 'Saving...' : 'Save changes'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
