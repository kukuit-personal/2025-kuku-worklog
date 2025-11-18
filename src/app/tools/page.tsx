'use client'

import Link from 'next/link'

export default function ToolsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Tools</h1>

      <div className="flex flex-col gap-4 max-w-sm">
        <Link
          href="/tools/random"
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-center hover:bg-blue-700"
        >
          Random
        </Link>

        <Link
          href="/tools/football"
          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-center hover:bg-emerald-700"
        >
          Football
        </Link>
      </div>
    </div>
  )
}
