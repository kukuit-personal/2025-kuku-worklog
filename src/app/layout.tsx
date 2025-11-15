import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import 'grapesjs/dist/css/grapes.min.css'
import NavbarLeft from '@/components/NavbarLeft'
import HeaderTop from '@/components/HeaderTop'
import BottomNavMobile from '@/components/BottomNavMobile'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KukuIt | Worklog',
  description: 'KukuIt Worklog System',
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  themeColor: '#f9fafb',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </head>
      <body className={`${inter.className} bg-gray-50`}>
        <div className="min-h-screen flex relative">
          {/* ✅ Checkbox điều khiển sidebar (peer) */}
          <input id="nav-toggle" type="checkbox" className="peer sr-only" />

          {/* Sidebar (off-canvas mobile, fixed width desktop) */}
          <NavbarLeft />

          {/* Main area */}
          <div className="flex-1 flex flex-col">
            <HeaderTop />
            {/* ✅ chừa khoảng cho bottom nav mobile */}
            <main className="flex-1 pb-12 sm:pb-0">{children}</main>
          </div>

          {/* ✅ Bottom nav chỉ cho mobile */}
          <BottomNavMobile />

          {/* ✅ Backdrop (cao hơn bottom nav nhờ z-index) */}
          <label
            htmlFor="nav-toggle"
            className="fixed inset-0 bg-black/30 z-40 hidden peer-checked:block sm:hidden"
            aria-hidden="true"
          />
        </div>
      </body>
    </html>
  )
}
