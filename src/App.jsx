import { Navigate, Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import InsightsScreen from './screens/InsightsScreen'
import LogScreen from './screens/LogScreen'
import SettingsScreen from './screens/SettingsScreen'
import TodayScreen from './screens/TodayScreen'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 text-gray-900 dark:bg-gray-950 dark:text-white md:pb-0">
      <BottomNav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 px-4 py-6 md:px-6 md:py-10">
        <Routes>
          <Route path="/log" element={<LogScreen />} />
          <Route path="/today" element={<TodayScreen />} />
          <Route path="/insights" element={<InsightsScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/log" replace />} />
        </Routes>
      </main>
    </div>
  )
}
