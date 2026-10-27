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
  Settings,
  Search,
  BarChart3,
  FileText,
  Sparkles,
} from 'lucide-react'
import Avatar from './ui/Avatar'
import { useProfile } from '../contexts/ProfileContext'
import GlobalSearch from './GlobalSearch'
import NotificationBell from './ui/NotificationBell'

// Grouped so the sidebar reads as sections, not a long list. Order matches
// a sales rep's daily flow: see the pulse, work the pipeline, then admin.
const navSections = [
  {
    label: 'Workspace',
    items: [
      { to: '/', label: 'Dashboard', end: true, icon: LayoutDashboard },
      { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    ],
  },
  {
    label: 'Sales',
    items: [
      { to: '/contacts', label: 'Contacts', icon: Users },
      { to: '/companies', label: 'Companies', icon: Building2 },
      { to: '/deals', label: 'Deals', icon: Handshake },
      { to: '/quotes', label: 'Quotes', icon: FileText },
      { to: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { to: '/careers', label: 'Career Applications', icon: Briefcase },
      { to: '/newsletter', label: 'Newsletter', icon: Mail },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

const allNavItems = navSections.flatMap((s) => s.items)

export default function Layout() {
  const { user, signOut } = useAuth()
  const { profile } = useProfile()
  const { theme, toggleTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const displayName = profile?.full_name ?? user?.email ?? '?'
  const roleLabel = profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : null
  const currentLabel = allNavItems.find((i) => (i.end ? location.pathname === i.to : location.pathname.startsWith(i.to)))?.label ?? ''

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors">
      <aside
        className={`shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-out shadow-elevation-sm ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Brand header — mark + wordmark on a subtle gradient wash so it feels
            like the brand surface, not just a plain row. */}
        <div className="h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-800 gap-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 to-transparent dark:from-brand-500/5 pointer-events-none" />
          <div className="relative flex items-center gap-2.5 w-full">
            <img src="/recykal-mark-black.png" alt="Recykal" className="h-7 w-auto shrink-0 dark:hidden" />
            <img src="/recykal-mark-white.png" alt="Recykal" className="h-7 w-auto shrink-0 hidden dark:block" />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight tracking-tight">Recykal</div>
                <div className="text-[10px] font-medium text-brand-700 dark:text-brand-400 uppercase tracking-wider">CRM Workspace</div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-2.5 py-4 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label} className="mb-5 last:mb-0">
              {!collapsed && (
                <div className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {section.label}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium btn-press ${
                          isActive
                            ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-brand-600 dark:bg-brand-400 rounded-r-full" />
                          )}
                          <Icon size={18} className={`shrink-0 ${isActive ? 'text-brand-600 dark:text-brand-400' : ''}`} strokeWidth={isActive ? 2.25 : 1.75} />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Profile card at bottom of sidebar. Collapsed mode shows just an avatar. */}
        {!collapsed && (
          <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <Avatar label={displayName} size={32} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{displayName}</div>
                {roleLabel && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                    {profile?.role === 'admin' && <Sparkles size={9} className="text-amber-500" />}
                    {roleLabel}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="px-2.5 py-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-colors btn-press"
          >
            {collapsed ? <ChevronsRight size={16} /> : (
              <>
                <ChevronsLeft size={16} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <GlobalSearch />

        <header className="h-16 shrink-0 flex items-center justify-between px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {navSections.find((s) => s.items.some((i) => (i.end ? location.pathname === i.to : location.pathname.startsWith(i.to))))?.label ?? ''}
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">{currentLabel}</h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
              title="Search (Ctrl+K)"
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800 text-xs transition-all min-w-56"
            >
              <Search size={14} />
              <span className="flex-1 text-left">Search contacts, deals, companies...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-500">Ctrl K</kbd>
            </button>

            <div className="ml-1 flex items-center gap-0.5 px-1 rounded-lg">
              <NotificationBell />

              <button
                onClick={toggleTheme}
                title="Toggle theme"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors btn-press"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

            <button
              onClick={signOut}
              title="Sign out"
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400 transition-colors btn-press"
            >
              <Avatar label={displayName} size={30} />
              <span className="text-sm font-medium max-w-32 truncate hidden sm:inline">{displayName.split(' ')[0]}</span>
              <LogOut size={15} className="opacity-60" />
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
