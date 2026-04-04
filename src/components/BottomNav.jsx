import { BarChart2, Calendar, ClipboardList, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/log', label: 'Log', icon: ClipboardList },
  { to: '/today', label: 'Today', icon: Calendar },
  { to: '/insights', label: 'Insights', icon: BarChart2 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 min-h-[60px] border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:sticky md:top-0 md:min-h-0">
      <div className="mx-auto flex max-w-5xl items-center justify-between md:px-6">
        <div className="hidden text-base font-semibold tracking-tight md:block">
          Life Pattern Tracker
        </div>

        <div className="flex w-full items-stretch justify-between md:w-auto md:justify-end md:gap-2 md:py-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition-colors md:flex-none md:flex-row md:rounded-lg md:px-3 md:py-2',
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400',
              ].join(' ')
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="text-[10px] leading-none md:text-xs">{label}</span>
          </NavLink>
        ))}
        </div>
      </div>
    </nav>
  )
}
