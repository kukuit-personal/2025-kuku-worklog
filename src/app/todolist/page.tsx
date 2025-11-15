'use client'

import { useTodoList } from './hooks/useTodoList'
import { FiltersBar } from './components/FiltersBar'
import { Pagination } from './components/Pagination'
import { EditModal } from './components/EditModal'
import { Spinner } from './components/Spinner'
import { PlusIcon } from './components/icons'
import { fmtDateInput } from './utils/date'
import { TodoFeed } from './components/TodoFeed'
import { TodoCategory, TodoPriority, TodoState } from './types'

export default function TodoPage() {
  const m = useTodoList()
  const hasMore = m.page < Math.max(1, Math.ceil(m.total / m.pageSize))

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Todo List</h1>
        <button
          onClick={() => m.setAddOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50"
          title={m.addOpen ? 'Hide add form' : 'Add new todo'}
        >
          <PlusIcon className="w-4 h-4" />
          <span className="hidden sm:inline">{m.addOpen ? 'Hide' : 'Add'}</span>
        </button>
      </div>

      {m.addOpen && (
        <div className="rounded-md border bg-white p-4 sm:p-5 mb-5">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 sm:gap-4">
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                value={m.form.title ?? ''}
                onChange={(e) => m.setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Task title"
                className="w-full rounded-md border px-3 py-1.5 text-sm"
              />
            </div>
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                value={m.form.description ?? ''}
                onChange={(e) => m.setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optional"
                className="w-full rounded-md border px-3 py-1.5 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={m.form.category ?? 'Personal'}
                onChange={(e) =>
                  m.setForm((prev) => ({ ...prev, category: e.target.value as TodoCategory }))
                }
                className="w-full rounded-md border px-3 py-1.5 text-sm"
              >
                {['Ainka', 'Kuku', 'Freelancer', 'Personal', 'Learning', 'Other'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select
                value={m.form.state ?? 'todo'}
                onChange={(e) =>
                  m.setForm((prev) => ({ ...prev, state: e.target.value as TodoState }))
                }
                className="w-full rounded-md border px-3 py-1.5 text-sm"
              >
                {[
                  ...[
                    { val: 'todo', label: 'To Do' },
                    { val: 'in_progress', label: 'In Progress' },
                    { val: 'waiting', label: 'Waiting' },
                    { val: 'blocked', label: 'Blocked' },
                    { val: 'done', label: 'Done' },
                    { val: 'canceled', label: 'Canceled' },
                    { val: 'archived', label: 'Archived' },
                  ],
                ].map((s) => (
                  <option key={s.val} value={s.val}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={m.form.priority ?? 'normal'}
                onChange={(e) =>
                  m.setForm((prev) => ({ ...prev, priority: e.target.value as TodoPriority }))
                }
                className="w-full rounded-md border px-3 py-1.5 text-sm"
              >
                {['low', 'normal', 'high', 'urgent', 'critical'].map((p) => (
                  <option key={p} value={p}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
              <input
                type="date"
                value={m.form.dueAt ?? ''}
                onChange={(e) => m.setForm((prev) => ({ ...prev, dueAt: e.target.value }))}
                className="w-full rounded-md border px-3 py-1.5 text-sm"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => m.setAddOpen(false)}
              className="px-3 py-1.5 rounded-md border hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={m.onCreateRoot}
              disabled={m.creating}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-green-600 bg-green-500 text-white hover:bg-green-600 disabled:opacity-60 text-sm"
            >
              {m.creating ? <Spinner className="w-4 h-4 text-white" /> : <PlusIcon />}
              <span>{m.creating ? 'Saving...' : 'Add todo'}</span>
            </button>
          </div>
        </div>
      )}

      <FiltersBar
        filters={m.filters}
        setFilters={m.setFilters}
        pageSize={m.pageSize}
        setPageSize={m.setPageSize as any}
        setPage={m.setPage as any}
      />

      {m.isLoading ? (
        <div className="rounded-md border bg-white p-8 text-center text-gray-600">
          <span className="inline-flex items-center gap-2">
            <Spinner className="w-4 h-4" /> Loading...
          </span>
        </div>
      ) : m.items.length === 0 ? (
        <div className="rounded-md border bg-white p-8 text-center text-gray-600">No records.</div>
      ) : (
        <TodoFeed
          items={m.items}
          subtasksMap={m.subtasks}
          subFormOpen={m.subFormOpen}
          setSubFormOpen={m.setSubFormOpen}
          onOpenEdit={(t) => m.openEdit(t, fmtDateInput)}
          onDelete={m.onDeleteById}
          onCreateSub={m.onCreateSub}
          onLoadMore={() => {}}
          hasMore={hasMore}
          isLoadingMore={false}
        />
      )}

      <Pagination total={m.total} page={m.page} pageSize={m.pageSize} setPage={m.setPage as any} />

      <EditModal
        open={!!m.editing}
        editing={m.editing}
        editForm={m.editForm as any}
        setEditForm={m.setEditForm as any}
        onClose={() => m.setEditing(null)}
        onSave={m.onUpdate}
        saving={m.updating}
      />
    </main>
  )
}
