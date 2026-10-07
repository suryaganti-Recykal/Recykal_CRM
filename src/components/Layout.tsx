import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Mail,
  Moon,
  Sun,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Building2,
  Handshake,
  CheckSquare,
} from 'lucide-react'
import Avatar from './ui/Avatar'

const navItems = [
  { to: '/', label: 'Dashboard', end: true, icon: LayoutDashboard },
  { to: '/contacts', label: 'Contacts', icon: Users },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/deals', label: 'Deals', icon: Handshake },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/careers', label: 'Career Applications', icon: Briefcase },
  { to: '/newsletter', label: 'Newsletter', icon: Mail },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const currentLabel = navItems.find((i) => (i.end ? location.pathname === i.to : location.pathname.startsWith(i.to)))?.label ?? ''

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors">
      <aside
        className={`shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="h-14 flex items-center px-4 border-b border-slate-200 dark:border-slate-800 gap-2.5">
          {/* Official Recykal mark. Shown plain (no container, no recolouring,
              no distortion) to respect the logo-usage rules in the brand
              guidelines. Two files rather than one recoloured file: the mark is
              solid black on light surfaces and solid white on dark ones. */}
          <img
            src="/recykal-mark-black.png"
            alt="Recykal"
            className="h-6 w-auto shrink-0 dark:hidden"
          />
          <img
            src="/recykal-mark-white.png"
            alt="Recykal"
            className="h-6 w-auto shrink-0 hidden dark:block"
          />
          {!collapsed && <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">Recykal CRM</h1>}
        </div>

        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        <div className="px-2.5 py-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 shrink-0 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{currentLabel}</h2>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              title="Toggle theme"
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

            <Avatar label={user?.email ?? '?'} size={30} />
            <span className="text-sm text-slate-600 dark:text-slate-400 max-w-40 truncate hidden sm:inline">{user?.email}</span>

            <button
              onClick={signOut}
              title="Sign out"
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 min-w-0 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
