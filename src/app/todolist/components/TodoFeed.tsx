'use client'

import { Todo } from '../types'
import TodoCard from './TodoCard'

export function TodoFeed({
  items,
  subtasksMap,
  subFormOpen,
  setSubFormOpen,
  onOpenEdit,
  onDelete,
  onCreateSub,
}: {
  items: Todo[]
  subtasksMap: Record<string, Todo[]>
  subFormOpen: Record<string, boolean> | null | undefined
  setSubFormOpen: (
    u: (m: Record<string, boolean> | null | undefined) => Record<string, boolean>
  ) => void
  onOpenEdit: (t: Todo) => void
  onDelete: (id: string) => void
  onCreateSub: (
    parentId: string,
    p: { title: string; dueAt: string; priority: Todo['priority']; state: Todo['state'] }
  ) => Promise<void>
}) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {items.map((it) => (
        <TodoCard
          key={it.id}
          item={it}
          subtasks={subtasksMap?.[it.id] ?? []}
          isSubFormOpen={!!subFormOpen?.[it.id]}
          onToggleSubForm={(_, open) =>
            setSubFormOpen((m) => {
              const base = m ?? {}
              return { ...base, [it.id]: open ?? !base[it.id] }
            })
          }
          onOpenEdit={onOpenEdit}
          onDelete={() => onDelete(it.id)}
          onCreateSub={(parentId, payload) => onCreateSub(parentId, payload)}
        />
      ))}
    </div>
  )
}
