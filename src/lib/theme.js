export function getStoredTheme() {
  if (typeof window === 'undefined') return 'system'
  return window.localStorage.getItem('theme') || 'system'
}

export function getSystemPrefersDark() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return

  const shouldUseDark = theme === 'dark' || (theme === 'system' && getSystemPrefersDark())
  document.documentElement.classList.toggle('dark', shouldUseDark)
}

export function setTheme(theme) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('theme', theme)
  }

  applyTheme(theme)
}
