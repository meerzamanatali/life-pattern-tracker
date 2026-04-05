import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Clock, ClipboardList, Calendar, BarChart2, Settings } from 'lucide-react'
import useAuthStore from '../store/authStore'

const navItems = [
  { to: '/log', label: 'Log', icon: ClipboardList },
  { to: '/today', label: 'Today', icon: Calendar },
  { to: '/insights', label: 'Insights', icon: BarChart2 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile } = useAuthStore()
  const [showMenu, setShowMenu] = useState(false)

  const avatarLetter = (
    profile?.full_name?.[0] ||
    user?.email?.[0] ||
    'U'
  ).toUpperCase()

  async function handleSignOut() {
    await useAuthStore.getState().signOut()
    setShowMenu(false)
    navigate('/')
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 h-16 border-t border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 md:hidden">
        <div className="flex h-full items-center justify-around">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to

            return (
              <button
                key={to}
                type="button"
                onClick={() => navigate(to)}
                className={[
                  'flex flex-1 flex-col items-center justify-center gap-1 py-2',
                  isActive ? 'text-blue-500' : 'text-gray-400',
                ].join(' ')}
              >
                <Icon size={20} />
                <span className="text-xs">{label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <nav className="fixed left-0 right-0 top-0 z-50 hidden h-16 items-center justify-between border-b border-gray-100 bg-white/80 px-8 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80 md:flex">
        <button
          type="button"
          onClick={() => navigate('/log')}
          className="flex items-center gap-2"
        >
          <Clock size={20} color="#3B82F6" />
          <span className="font-bold text-gray-900 dark:text-white">Life Pattern Tracker</span>
        </button>

        <div className="flex items-center gap-6">
          {navItems.map(({ to, label }) => {
            const isActive = location.pathname === to

            return (
              <button
                key={to}
                type="button"
                onClick={() => navigate(to)}
                className={[
                  'text-sm font-medium transition-colors',
                  isActive
                    ? 'text-blue-500'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white',
                ].join(' ')}
              >
                {label}
              </button>
            )
          })}

          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu((current) => !current)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white"
              aria-label="Open user menu"
            >
              {avatarLetter}
            </button>

            {showMenu ? (
              <div className="absolute right-0 top-full z-50 mt-2 min-w-48 rounded-xl border border-gray-100 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <p className="px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white">
                  {profile?.full_name || 'User'}
                </p>
                <p className="px-3 pb-2 text-xs text-gray-500">{user?.email || ''}</p>
                <div className="my-1 h-px bg-gray-100 dark:bg-gray-700" />
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-500 transition hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </nav>
    </>
  )
}
