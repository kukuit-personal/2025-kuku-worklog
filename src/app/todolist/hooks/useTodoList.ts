'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { FilterMode, Todo, TodoCategory, TodoPriority, TodoState } from '../types'
import {
  listTodos,
  listSubtasks,
  createTodo,
  updateTodo,
  deleteTodo,
} from '../services/todos.service'

// Kiểu form tạo mới: dùng đúng union types để khớp Partial<Todo>
type NewForm = {
  title: string
  description: string
  category: TodoCategory
  priority: TodoPriority
  state: TodoState
  dueAt: string
}

function isTodayTaskPriorities(p: FilterMode['priorities']) {
  if (p === 'all') return false
  const s = new Set(p)
  return s.size === 2 && s.has('urgent') && s.has('critical')
}

export function useTodoList() {
  const [items, setItems] = useState<Todo[]>([])
  const [subtasks, setSubtasks] = useState<Record<string, Todo[]>>({})
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<FilterMode>({
    states: ['todo', 'in_progress'],
    categories: 'all',
    priorities: 'all',
  })

  // NEW: Today task flag (derived + stored)
  const [todayTaskOn, setTodayTaskOn] = useState(false)

  useEffect(() => {
    setTodayTaskOn(isTodayTaskPriorities(filters.priorities))
  }, [filters.priorities])

  function toggleTodayTask() {
    setPage(1)
    setFilters((f) => ({
      ...f,
      priorities: isTodayTaskPriorities(f.priorities)
        ? 'all'
        : (['urgent', 'critical'] as TodoPriority[]),
    }))
  }

  const [isLoading, setIsLoading] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  // 🔧 Quan trọng: form gõ đúng kiểu, không dùng string thuần
  const [form, setForm] = useState<NewForm>({
    title: '',
    description: '',
    category: 'Personal',
    priority: 'normal',
    state: 'todo',
    dueAt: '',
  })
  const [creating, setCreating] = useState(false)

  const [editing, setEditing] = useState<Todo | null>(null)
  const [editForm, setEditForm] = useState<Partial<Todo>>({})
  const [updating, setUpdating] = useState(false)

  const [subFormOpen, setSubFormOpen] = useState<Record<string, boolean>>({})

  const prefetchSubtasksFor = useCallback(
    async (list: Todo[]) => {
      if (!list?.length) return
      await Promise.allSettled(
        list.map(async (it) => {
          try {
            const data = await listSubtasks(it.id, filters)
            setSubtasks((m) => ({ ...m, [it.id]: data.items ?? [] }))
          } catch {
            setSubtasks((m) => ({ ...m, [it.id]: [] }))
          }
        })
      )
    },
    [filters]
  )

  const fetchList = useCallback(async () => {
    setIsLoading(true)
    try {
      const skip = (page - 1) * pageSize
      const data = await listTodos(filters, skip, pageSize)
      const roots: Todo[] = data.items ?? []
      setItems(roots)
      setTotal(data.total ?? 0)
      await prefetchSubtasksFor(roots)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [filters, page, pageSize, prefetchSubtasksFor])

  useEffect(() => {
    setSubtasks({})
    fetchList()
  }, [fetchList])

  // ===== Create root =====
  async function onCreateRoot() {
    if (!form.title.trim()) return alert('Title is required')
    try {
      setCreating(true)
      // form giờ đã đúng kiểu => hợp lệ với Partial<Todo>
      await createTodo(form)
      setForm({
        title: '',
        description: '',
        category: 'Personal',
        priority: 'normal',
        state: 'todo',
        dueAt: '',
      })
      await fetchList()
    } catch (e: any) {
      alert(e?.message || 'Create failed')
    } finally {
      setCreating(false)
    }
  }

  async function loadSub(parentId: string) {
    try {
      const data = await listSubtasks(parentId, filters)
      setSubtasks((m) => ({ ...m, [parentId]: data.items ?? [] }))
    } catch (e: any) {
      alert(e?.message || 'Load subtasks failed')
    }
  }

  async function onCreateSub(parentId: string, sub: Partial<Todo>) {
    if (!sub.title?.trim()) return alert('Title required')
    try {
      await createTodo({ ...sub, parentId })
      await loadSub(parentId)
    } catch (e: any) {
      alert(e?.message || 'Create subtask failed')
    }
  }

  function openEdit(todo: Todo, fmtDateInput: (d?: string | null) => string) {
    setEditing(todo)
    setEditForm({
      ...todo,
      dueAt: fmtDateInput(todo.dueAt),
    })
  }

  async function onUpdate() {
    if (!editing) return
    try {
      setUpdating(true)
      await updateTodo(editing.id, editForm)
      setEditing(null)
      await fetchList()
    } catch (e: any) {
      alert(e?.message || 'Update failed')
    } finally {
      setUpdating(false)
    }
  }

  async function onDelete(todo: Todo) {
    if (!confirm('Delete this task?')) return
    try {
      await deleteTodo(todo.id)
      await fetchList()
    } catch (e: any) {
      alert(e?.message || 'Delete failed')
    }
  }

  async function onDeleteById(id: string) {
    const todo = items.find((x) => x.id === id)
    if (todo) await onDelete(todo)
  }

  return {
    items,
    subtasks,
    total,
    page,
    pageSize,
    filters,
    addOpen,
    form,
    creating,
    editing,
    editForm,
    updating,
    isLoading,
    subFormOpen,

    // NEW
    todayTaskOn,
    toggleTodayTask,

    setFilters,
    setPage,
    setPageSize,
    setAddOpen,
    setForm,
    setEditing,
    setEditForm,
    setSubFormOpen,

    onCreateRoot,
    onUpdate,
    onDelete,
    onDeleteById,
    onCreateSub,
    openEdit,
    loadSub,
  }
}
