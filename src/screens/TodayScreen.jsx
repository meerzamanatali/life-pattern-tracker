import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/authStore'

const CATEGORY_COLORS = {
  Learning: '#3B82F6',
  Work: '#14B8A6',
  'Social Media': '#F59E0B',
  'Self-care': '#8B5CF6',
  Other: '#6B7280',
}

const MOOD_EMOJIS = ['😞', '😕', '😐', '🙂', '😄']

function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

function parseMinutes(time) {
  if (!time) return null
  const [hours, minutes] = time.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return hours * 60 + minutes
}

function formatMinutes(totalMinutes) {
  if (!totalMinutes) return '0m'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours && minutes) return `${hours}h ${minutes}m`
  if (hours) return `${hours}h`
  return `${minutes}m`
}

function formatTime(time) {
  if (!time) return ''
  const [hourString, minuteString] = time.split(':')
  const hours = Number(hourString)
  const minutes = Number(minuteString)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time
  return `${hours}:${String(minutes).padStart(2, '0')}`
}

function getMoodEmoji(mood) {
  if (!mood) return null
  return MOOD_EMOJIS[mood - 1] || null
}

function SummaryStars({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 5 }, (_, index) => {
        const rating = index + 1
        const active = rating <= value

        return (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(value === rating ? 0 : rating)}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white text-2xl dark:border-gray-700 dark:bg-gray-950"
          >
            <span className={active ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}>
              ★
            </span>
          </button>
        )
      })}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl bg-gray-100 p-4 dark:bg-gray-800">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  )
}

export default function TodayScreen() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [entries, setEntries] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [savingSummary, setSavingSummary] = useState(false)
  const [summaryForm, setSummaryForm] = useState({
    wakeTime: '',
    sleepQuality: 0,
    dayRating: 0,
    goalMet: null,
    note: '',
  })

  const today = useMemo(() => getTodayDate(), [])
  const dailyGoal = useMemo(() => localStorage.getItem('dailyGoal') || '', [])

  const loadTodayData = useCallback(async () => {
    setLoading(true)
    setError('')

    const [entriesResult, summaryResult] = await Promise.all([
      supabase
        .from('entries')
        .select('*')
        .eq('date', today)
        .order('start_time', { ascending: true }),
      supabase.from('daily_summaries').select('*').eq('date', today).maybeSingle(),
    ])

    if (entriesResult.error) {
      setError(entriesResult.error.message || 'Could not load today\'s entries')
      setLoading(false)
      return
    }

    if (summaryResult.error) {
      setError(summaryResult.error.message || 'Could not load today\'s summary')
      setLoading(false)
      return
    }

    setEntries(entriesResult.data || [])

    if (summaryResult.data) {
      setSummaryForm({
        wakeTime: summaryResult.data.wake_time || '',
        sleepQuality: summaryResult.data.sleep_quality || 0,
        dayRating: summaryResult.data.day_rating || 0,
        goalMet:
          typeof summaryResult.data.goal_met === 'boolean' ? summaryResult.data.goal_met : null,
        note: summaryResult.data.note || '',
      })
    } else {
      setSummaryForm({
        wakeTime: '',
        sleepQuality: 0,
        dayRating: 0,
        goalMet: null,
        note: '',
      })
    }

    setLoading(false)
  }, [today])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadTodayData()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadTodayData])

  useEffect(() => {
    if (!toast) return undefined
    const timeoutId = window.setTimeout(() => setToast(''), 2000)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  async function handleDeleteEntry(entryId) {
    const confirmed = window.confirm('Delete this entry?')
    if (!confirmed) return

    const { error: deleteError } = await supabase.from('entries').delete().eq('id', entryId)

    if (deleteError) {
      setError(deleteError.message || 'Could not delete entry')
      return
    }

    setEntries((current) => current.filter((entry) => entry.id !== entryId))
    setExpandedId((current) => (current === entryId ? null : current))
  }

  async function handleSaveSummary(event) {
    event.preventDefault()
    setSavingSummary(true)
    setError('')

    const today = new Date().toISOString().split('T')[0]
    const wakeTime = summaryForm.wakeTime
    const sleepQuality = summaryForm.sleepQuality
    const dayRating = summaryForm.dayRating
    const goalMet = summaryForm.goalMet
    const summaryNote = summaryForm.note.trim()

    const { error } = await supabase
      .from('daily_summaries')
      .upsert(
        {
          user_id: user.id,
          date: today,
          wake_time: wakeTime || null,
          sleep_quality: sleepQuality || null,
          day_rating: dayRating || null,
          daily_goal_met: goalMet,
          note: summaryNote || null,
        },
        { onConflict: 'date' }
      )

    if (error) {
      console.error('Save failed:', error.message)
      setError(error.message || 'Could not save day summary')
      setSavingSummary(false)
      return
    }

    console.log('Daily summary saved!')
    setToast('Day summary saved!')
    setSavingSummary(false)
  }

  const stats = useMemo(() => {
    const totalLogged = entries.reduce((sum, entry) => sum + (entry.duration_mins || 0), 0)
    const productive = entries.reduce((sum, entry) => {
      if (entry.category === 'Learning' || entry.category === 'Work') {
        return sum + (entry.duration_mins || 0)
      }
      return sum
    }, 0)
    const socialMedia = entries.reduce((sum, entry) => {
      if (entry.category === 'Social Media') {
        return sum + (entry.duration_mins || 0)
      }
      return sum
    }, 0)

    return {
      totalLogged: formatMinutes(totalLogged),
      productive: formatMinutes(productive),
      productiveMins: productive,
      socialMedia: formatMinutes(socialMedia),
      entries: String(entries.length),
    }
  }, [entries])

  const goalProgress = useMemo(() => {
    if (!dailyGoal) return null

    const match = dailyGoal.match(/(\d+)\s*hour/i)
    const targetHours = match ? parseInt(match[1], 10) : 2
    const progress = Math.min((stats.productiveMins / (targetHours * 60)) * 100, 100)

    return {
      text: dailyGoal,
      targetHours,
      progress,
      met: progress >= 100,
    }
  }, [dailyGoal, stats.productiveMins])

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Today
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          A quick view of what you logged today, what’s missing, and how the day felt overall.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {goalProgress ? (
        <section className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Today&apos;s goal: {goalProgress.text}
          </p>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={[
                'h-full rounded-full transition-all',
                goalProgress.progress >= 100
                  ? 'bg-green-500'
                  : goalProgress.progress >= 50
                    ? 'bg-blue-500'
                    : 'bg-amber-500',
              ].join(' ')}
              style={{ width: `${goalProgress.progress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {(stats.productiveMins / 60).toFixed(1)}h / {goalProgress.targetHours}h
          </p>
          {goalProgress.met ? (
            <div className="mt-2 flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Goal met today!</span>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-3">
        <StatCard label="Total Logged" value={stats.totalLogged} />
        <StatCard label="Productive" value={stats.productive} />
        <StatCard label="Social Media" value={stats.socialMedia} />
        <StatCard label="Entries" value={stats.entries} />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Timeline</h2>
        </div>

        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center dark:border-gray-700 dark:bg-gray-900">
            <p className="text-lg font-medium text-gray-900 dark:text-white">No entries yet today</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Start logging your day!</p>
            <button
              type="button"
              onClick={() => navigate('/log')}
              className="mt-5 min-h-12 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white dark:bg-blue-500"
            >
              Log first entry
            </button>
          </div>
        ) : (
          entries.map((entry, index) => {
            const nextEntry = entries[index + 1]
            const categoryColor = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.Other
            const moodEmoji = getMoodEmoji(entry.mood)
            const isExpanded = expandedId === entry.id
            const entryCard = (
              <div
                key={entry.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex">
                  <div className="w-1.5 shrink-0" style={{ backgroundColor: categoryColor }} />
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    onTouchStart={(event) => {
                      event.currentTarget.dataset.touchStartX = String(
                        event.changedTouches[0]?.clientX ?? 0
                      )
                    }}
                    onTouchEnd={(event) => {
                      const startX = Number(event.currentTarget.dataset.touchStartX || 0)
                      const endX = event.changedTouches[0]?.clientX ?? 0
                      if (startX - endX > 70) {
                        void handleDeleteEntry(entry.id)
                      }
                    }}
                    className="flex min-h-12 flex-1 items-start justify-between gap-3 px-4 py-4 text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {entry.activity_name}
                        </p>
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: `${categoryColor}22`,
                            color: categoryColor,
                          }}
                        >
                          {entry.category || 'Other'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(entry.start_time)} - {formatTime(entry.end_time)} •{' '}
                        {formatMinutes(entry.duration_mins || 0)}
                      </p>
                      {(entry.energy_before || entry.energy_after || moodEmoji) && (
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                          {entry.energy_before && entry.energy_after ? (
                            <span>
                              ⚡{entry.energy_before} → ⚡{entry.energy_after}
                            </span>
                          ) : null}
                          {moodEmoji ? <span>{moodEmoji}</span> : null}
                        </div>
                      )}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteEntry(entry.id)}
                    className="flex min-h-12 items-center px-4 text-red-500"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                {isExpanded ? (
                  <div className="border-t border-gray-100 px-4 py-4 text-sm dark:border-gray-800">
                    <div className="grid gap-2 text-gray-600 dark:text-gray-300">
                      {entry.trigger ? <p>Trigger: {entry.trigger}</p> : null}
                      {entry.location ? <p>Location: {entry.location}</p> : null}
                      {entry.device ? <p>Device: {entry.device}</p> : null}
                      {typeof entry.is_planned === 'boolean' ? (
                        <p>Planned: {entry.is_planned ? 'Yes' : 'No'}</p>
                      ) : null}
                      {typeof entry.regret === 'boolean' ? (
                        <p>Regret: {entry.regret ? 'Yes' : 'No'}</p>
                      ) : null}
                      {entry.topic ? <p>Topic: {entry.topic}</p> : null}
                      {entry.resource_type ? <p>Resource: {entry.resource_type}</p> : null}
                      {entry.understood ? <p>Understood: {entry.understood}</p> : null}
                      {entry.note ? <p>Note: {entry.note}</p> : null}
                    </div>
                  </div>
                ) : null}
              </div>
            )

            if (!nextEntry) {
              return entryCard
            }

            const currentEnd = parseMinutes(entry.end_time)
            const nextStart = parseMinutes(nextEntry.start_time)
            const gapMinutes =
              currentEnd !== null && nextStart !== null ? Math.max(nextStart - currentEnd, 0) : 0

            return (
              <div key={entry.id} className="space-y-3">
                {entryCard}
                {gapMinutes > 15 ? (
                  <button
                    type="button"
                    onClick={() => navigate('/log')}
                    className="flex min-h-12 w-full items-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-left text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
                  >
                    ⏱ {formatMinutes(gapMinutes)} unlogged — tap to log
                  </button>
                ) : null}
              </div>
            )
          })
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Summary</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Capture how the day felt overall and whether it matched your intent.
        </p>

        <form onSubmit={handleSaveSummary} className="mt-5 grid gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Wake time
            </label>
            <input
              type="time"
              value={summaryForm.wakeTime}
              onChange={(event) =>
                setSummaryForm((current) => ({ ...current, wakeTime: event.target.value }))
              }
              className="min-h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sleep quality
            </label>
            <SummaryStars
              value={summaryForm.sleepQuality}
              onChange={(value) =>
                setSummaryForm((current) => ({ ...current, sleepQuality: value }))
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Day rating
            </label>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
              {Array.from({ length: 10 }, (_, index) => {
                const value = index + 1
                const active = summaryForm.dayRating === value

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setSummaryForm((current) => ({
                        ...current,
                        dayRating: current.dayRating === value ? 0 : value,
                      }))
                    }
                    className={[
                      'min-h-12 rounded-xl border px-3 py-3 text-sm font-medium',
                      active
                        ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500'
                        : 'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200',
                    ].join(' ')}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Goal met
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[true, false].map((option) => {
                const active = summaryForm.goalMet === option

                return (
                  <button
                    key={String(option)}
                    type="button"
                    onClick={() =>
                      setSummaryForm((current) => ({
                        ...current,
                        goalMet: current.goalMet === option ? null : option,
                      }))
                    }
                    className={[
                      'min-h-12 rounded-xl border px-4 py-3 text-sm font-medium',
                      active
                        ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500'
                        : 'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200',
                    ].join(' ')}
                  >
                    {option ? 'Yes' : 'No'}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Note
            </label>
            <textarea
              rows={4}
              value={summaryForm.note}
              onChange={(event) =>
                setSummaryForm((current) => ({ ...current, note: event.target.value }))
              }
              placeholder="Optional reflection for today..."
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={savingSummary}
            className="min-h-12 rounded-2xl bg-blue-600 px-4 py-4 text-base font-semibold text-white disabled:opacity-70 dark:bg-blue-500"
          >
            {savingSummary ? 'Saving...' : 'Save Summary'}
          </button>
        </form>
      </section>

      {toast ? (
        <div className="fixed left-1/2 top-4 z-30 -translate-x-1/2 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
