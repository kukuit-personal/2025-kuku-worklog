import type { TodoCategory } from '../types'

export function categoryTagColor(category?: TodoCategory): string {
  switch (category) {
    case 'Ainka':
      return 'bg-blue-600'
    case 'Kuku':
      return 'bg-gray-500'
    case 'Freelancer':
      return 'bg-emerald-500'
    case 'Personal':
      return 'bg-purple-500'
    case 'Learning':
      return 'bg-sky-400'
    case 'Other':
    default:
      return 'bg-slate-400'
  }
}
