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

const ProtectedAppLayout = ({ children }) => (
  <ProtectedRoute>
    <div className="pb-16 md:pb-0 md:pt-16">
      {children}
      <BottomNav />
    </div>
  </ProtectedRoute>
)

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
              <ProtectedAppLayout>
                <LogScreen />
              </ProtectedAppLayout>
            }
          />
          <Route
            path="/today"
            element={
              <ProtectedAppLayout>
                <TodayScreen />
              </ProtectedAppLayout>
            }
          />
          <Route
            path="/insights"
            element={
              <ProtectedAppLayout>
                <InsightsScreen />
              </ProtectedAppLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedAppLayout>
                <SettingsScreen />
              </ProtectedAppLayout>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
