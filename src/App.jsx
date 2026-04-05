import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './screens/LandingPage'
import LoginScreen from './screens/LoginScreen'
import SignupScreen from './screens/SignupScreen'
import WelcomeScreen from './screens/WelcomeScreen'
import LogScreen from './screens/LogScreen'
import TodayScreen from './screens/TodayScreen'
import InsightsScreen from './screens/InsightsScreen'
import SettingsScreen from './screens/SettingsScreen'
import BottomNav from './components/BottomNav'
import useAuthStore from './store/authStore'

const App = () => {
  const { session } = useAuthStore()

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={session ? <Navigate to="/log" replace /> : <LoginScreen />}
          />
          <Route
            path="/signup"
            element={session ? <Navigate to="/log" replace /> : <SignupScreen />}
          />
          <Route
            path="/welcome"
            element={
              <ProtectedRoute>
                <WelcomeScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/log"
            element={
              <ProtectedRoute>
                <LogScreen />
                <BottomNav />
              </ProtectedRoute>
            }
          />
          <Route
            path="/today"
            element={
              <ProtectedRoute>
                <TodayScreen />
                <BottomNav />
              </ProtectedRoute>
            }
          />
          <Route
            path="/insights"
            element={
              <ProtectedRoute>
                <InsightsScreen />
                <BottomNav />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsScreen />
                <BottomNav />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
