import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import useAuthStore from '../store/authStore'

export default function SignupScreen() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !confirmPassword || !couponCode) {
      setError('Please fill in all fields')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (!couponCode.startsWith('LPT_')) {
      setError('Invalid invite code format')
      return
    }

    setError('')
    setLoading(true)

    try {
      await useAuthStore.getState().signUp(email, password, fullName, couponCode)
      navigate('/welcome')
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    void handleSignUp()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 dark:bg-gray-950">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <img
            src="/apple-touch-icon.png"
            alt="logo"
            className="mx-auto h-14 w-14 rounded-2xl"
          />
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            Life Pattern Tracker
          </span>
        </div>

        <h1 className="mb-1 text-center text-2xl font-bold text-gray-900 dark:text-white">
          Create your account
        </h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          You need an invite code to join
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Full name
            </label>
            <input
              type="text"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-11 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">Minimum 8 characters</p>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-11 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Invite code
            </label>
            <input
              type="text"
              placeholder="LPT_XXXXXX"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-400">Enter the invite code you received</p>
          </div>

          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-500 py-3 font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                <span>Creating account...</span>
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-500 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
