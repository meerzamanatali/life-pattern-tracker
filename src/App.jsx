import { useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import InsightsScreen from './screens/InsightsScreen'
import LandingPage from './screens/LandingPage'
import LogScreen from './screens/LogScreen'
import SettingsScreen from './screens/SettingsScreen'
import TodayScreen from './screens/TodayScreen'

export default function App() {
  const location = useLocation()
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstallBanner, setShowInstallBanner] = useState(() => {
    return localStorage.getItem('pwaInstallDismissed') !== 'true'
  })
  const isLandingPage = location.pathname === '/'
  const showBottomNav = location.pathname !== '/'

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault()

      if (localStorage.getItem('pwaInstallDismissed') === 'true') return

      setInstallPrompt(event)
      setShowInstallBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!installPrompt) return

    await installPrompt.prompt()
    const choice = await installPrompt.userChoice

    if (choice?.outcome === 'accepted') {
      setShowInstallBanner(false)
    }

    setInstallPrompt(null)
  }

  function handleDismissInstallBanner() {
    localStorage.setItem('pwaInstallDismissed', 'true')
    setShowInstallBanner(false)
  }

  return (
    <div
      className={[
        'min-h-screen text-gray-900 dark:bg-gray-950 dark:text-white',
        isLandingPage ? 'bg-white pb-0 dark:bg-gray-950' : 'bg-gray-50 pb-20 md:pb-0',
      ].join(' ')}
    >
      {showInstallBanner && installPrompt ? (
        <div className="flex items-center justify-between gap-3 bg-blue-500 p-3 text-sm text-white">
          <p>Install Life Pattern Tracker as an app</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleInstall()}
              className="rounded-full bg-white px-3 py-1 font-semibold text-blue-600"
            >
              Install
            </button>
            <button
              type="button"
              onClick={handleDismissInstallBanner}
              className="rounded-full px-2 py-1 text-white"
              aria-label="Dismiss install prompt"
            >
              X
            </button>
          </div>
        </div>
      ) : null}
      {showBottomNav ? <BottomNav /> : null}
      <main
        className={
          isLandingPage
            ? 'w-full'
            : 'mx-auto flex w-full max-w-5xl flex-1 px-4 py-6 md:px-6 md:py-10'
        }
      >
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/log" element={<LogScreen />} />
          <Route path="/today" element={<TodayScreen />} />
          <Route path="/insights" element={<InsightsScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </main>
    </div>
  )
}
