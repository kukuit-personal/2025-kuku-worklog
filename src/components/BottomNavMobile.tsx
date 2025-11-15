'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from './NavbarLeft'

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/')
}

export default function BottomNavMobile() {
  const pathname = usePathname() || '/'

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 border-t bg-white/90 backdrop-blur">
      <div className="max-w-md mx-auto flex justify-around py-1.5 px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex flex-col items-center gap-0.5 text-[11px]',
                'text-gray-600',
                active ? 'text-indigo-600 font-medium' : '',
              ].join(' ')}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.3 : 2} />
              <span className="leading-none">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
