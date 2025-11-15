import { TodoPriority } from '../types'

export function priorityBgText(priority: TodoPriority) {
  switch (priority) {
    case 'critical':
      return 'bg-red-600 text-white'
    case 'urgent':
      return 'bg-red-100 text-gray-900'
    case 'high':
      return 'bg-orange-200 text-gray-900'
    case 'normal':
      return 'bg-green-200 text-gray-900'
    case 'low':
    default:
      return 'bg-green-100 text-gray-900'
  }
}
