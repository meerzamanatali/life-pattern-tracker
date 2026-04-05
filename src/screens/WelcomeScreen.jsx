import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function WelcomeScreen() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  function handleStartTracking() {
    const userId = user?.id
    localStorage.setItem('hasSeenWelcome_' + userId, 'true')
    navigate('/log')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center dark:bg-gray-950">
      <style>
        {`
          @keyframes wave {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(20deg); }
            75% { transform: rotate(-10deg); }
          }
        `}
      </style>

      <div className="mb-6 text-6xl" style={{ animation: 'wave 1.5s ease-in-out 3' }}>
        {'\u{1F44B}'}
      </div>

      <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
        Welcome, {firstName}!
      </h1>

      <p className="mx-auto mb-12 max-w-md leading-relaxed text-gray-500 dark:text-gray-400">
        Your private space is ready. Everything you log here is yours alone - no one else
        can see it.
      </p>

      <div className="mx-auto mb-12 grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 text-3xl">{'\u{1F4DD}'}</div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Start logging</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Log your first activity to get started
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 text-3xl">{'\u{1F4CA}'}</div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Check Today</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            See your stats after a few entries
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 text-3xl">{'\u{1F4A1}'}</div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Unlock insights</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Patterns appear after 7 days of logging
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleStartTracking}
        className="rounded-full bg-blue-500 px-10 py-4 text-base font-semibold text-white transition-all hover:scale-105 hover:bg-blue-600"
      >
        Start Tracking
      </button>
    </div>
  )
}
