import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma, Status, TodoPriority, TodoState, TodoCategory } from '@prisma/client'

export const revalidate = 0
export const dynamic = 'force-dynamic'

// yyyy-mm-dd -> Date at 00:00 & 23:59:59.999 (UTC)
function toStartOfDay(d: string) {
  return new Date(`${d}T00:00:00.000Z`)
}
function toEndOfDay(d: string) {
  return new Date(`${d}T23:59:59.999Z`)
}

// Helpers
function parseEnum<T extends string>(val: any, allowed: readonly T[]): T | undefined {
  return (allowed as readonly string[]).includes(val) ? (val as T) : undefined
}
function parseCSVEnum<T extends string>(
  raw: string | null,
  allowed: readonly T[],
  { treatAllAsNoFilter = true }: { treatAllAsNoFilter?: boolean } = {}
): T[] {
  if (!raw || !raw.trim()) return []
  if (treatAllAsNoFilter && raw === 'all') return []
  const arr = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as T[]
  return arr.filter((x) => (allowed as readonly string[]).includes(x))
}

// ============ GET /api/todos ============
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    // status
    const statusParam = (searchParams.get('status') || 'active').toLowerCase()
    const isAllStatus = statusParam === 'all'
    const statusFilter: Status =
      statusParam === 'active' || statusParam === 'disabled'
        ? (statusParam as Status)
        : Status.active

    // MULTI filters (CSV)
    const states = parseCSVEnum<TodoState>(searchParams.get('state'), [
      'todo',
      'in_progress',
      'waiting',
      'blocked',
      'done',
      'canceled',
      'archived',
    ] as const)

    const categories = parseCSVEnum<TodoCategory>(searchParams.get('category'), [
      'Ainka',
      'Kuku',
      'Freelancer',
      'Personal',
      'Learning',
      'Other',
    ] as const)

    const priorities = parseCSVEnum<TodoPriority>(searchParams.get('priority'), [
      'low',
      'normal',
      'high',
      'urgent',
      'critical',
    ] as const)

    // Parent filter
    const parentIdParam = searchParams.get('parentId')
    const parentFilter =
      parentIdParam === '__root__'
        ? { parentId: null }
        : parentIdParam
          ? { parentId: parentIdParam }
          : {}

    // Search + due range
    const qRaw = (searchParams.get('q') || '').trim()
    const q = qRaw.slice(0, 200)
    const dueFrom = searchParams.get('dueFrom') || ''
    const dueTo = searchParams.get('dueTo') || ''

    // Paging
    const skipParam = searchParams.get('skip')
    const takeParam = searchParams.get('take')
    const skip = skipParam != null ? Math.max(parseInt(skipParam, 10) || 0, 0) : 0
    const take = takeParam != null ? Math.min(Math.max(parseInt(takeParam, 10) || 0, 1), 200) : 100

    // ORDER
    const orderFieldParam = searchParams.get('order')
    const orderField: 'dueAt' | 'createdAt' | 'updatedAt' =
      orderFieldParam === 'createdAt' || orderFieldParam === 'updatedAt' ? orderFieldParam : 'dueAt'
    const orderDir: 'asc' | 'desc' = searchParams.get('dir') === 'desc' ? 'desc' : 'asc'

    // WHERE
    const where: Prisma.TodoWhereInput = {
      ...(isAllStatus ? {} : { status: statusFilter }),
      ...(states.length ? { state: { in: states } } : {}),
      ...(categories.length ? { category: { in: categories } } : {}),
      ...(priorities.length ? { priority: { in: priorities } } : {}),
      ...parentFilter,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              { labels: { has: q } },
            ],
          }
        : {}),
      ...(dueFrom || dueTo
        ? {
            dueAt: {
              ...(dueFrom ? { gte: toStartOfDay(dueFrom) } : {}),
              ...(dueTo ? { lte: toEndOfDay(dueTo) } : {}),
            },
          }
        : {}),
    }

    // ===== ORDER BY FIX =====
    let orderBy: Prisma.TodoOrderByWithRelationInput[] = []

    if (orderField === 'dueAt') {
      // Ưu tiên priority trước
      orderBy.push({ priority: 'desc' })
      // Nếu priority bằng nhau → xét dueAt
      orderBy.push({ dueAt: orderDir })
      // Cuối cùng fallback createdAt
      orderBy.push({ createdAt: 'desc' })
    } else if (orderField === 'createdAt') {
      orderBy.push({ createdAt: orderDir })
      orderBy.push({ createdAt: 'desc' })
    } else {
      orderBy.push({ updatedAt: orderDir })
      orderBy.push({ createdAt: 'desc' })
    }

    // Query DB
    const [items, total] = await Promise.all([
      prisma.todo.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      prisma.todo.count({ where }),
    ])

    return NextResponse.json({
      status: isAllStatus ? 'all' : statusFilter,
      states,
      categories: categories.length ? categories : 'all',
      priorities: priorities.length ? priorities : 'all',
      parentId: parentIdParam ?? null,
      q,
      dueFrom,
      dueTo,
      skip,
      take,
      total,
      items,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

// ============ POST /api/todos ============
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))

    // labels: chuỗi hoặc mảng
    let labels: string[] | null = null
    if (Array.isArray(body.labels)) {
      labels = body.labels.map((s: any) => String(s)).filter(Boolean)
    } else if (typeof body.labels === 'string') {
      labels = body.labels
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
    }

    const data = {
      title: String(body.title ?? '').trim(),
      description: body.description ?? null,
      labels: labels ?? [],
      category:
        parseEnum<TodoCategory>(body.category, [
          'Ainka',
          'Kuku',
          'Freelancer',
          'Personal',
          'Learning',
          'Other',
        ] as const) ?? TodoCategory.Other,
      priority:
        parseEnum<TodoPriority>(body.priority, [
          'low',
          'normal',
          'high',
          'urgent',
          'critical',
        ] as const) ?? TodoPriority.normal,
      state:
        parseEnum<TodoState>(body.state, [
          'todo',
          'in_progress',
          'waiting',
          'blocked',
          'done',
          'canceled',
          'archived',
        ] as const) ?? TodoState.todo,

      dueAt: body.dueAt ? new Date(String(body.dueAt)) : null,
      startedAt: body.startedAt ? new Date(String(body.startedAt)) : null,
      completedAt: body.completedAt ? new Date(String(body.completedAt)) : null,
      canceledAt: body.canceledAt ? new Date(String(body.canceledAt)) : null,

      estimateMin: body.estimateMin != null ? Number(body.estimateMin) : null,
      spentMin: body.spentMin != null ? Number(body.spentMin) : null,
      waitingOn: body.waitingOn ?? null,

      parentId: body.parentId ?? null,
      sortOrder: body.sortOrder != null ? Number(body.sortOrder) : null,

      status: body.status === 'disabled' ? Status.disabled : Status.active,
    }

    if (!data.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const created = await prisma.todo.create({ data })
    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Cannot create' }, { status: 500 })
  }
}
