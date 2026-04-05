import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BarChart2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

const TABS = ['This Week', 'Heatmap', 'Week vs Week', 'Patterns']

const CATEGORY_COLORS = {
  Learning: '#3B82F6',
  Work: '#14B8A6',
  'Social Media': '#F59E0B',
  'Self-care': '#8B5CF6',
  Other: '#6B7280',
}

const CHART_KEYS = ['Learning', 'Work', 'Social Media', 'Self-care', 'Other']

function formatDateKey(date) {
  return date.toISOString().split('T')[0]
}

function getLastSevenDays() {
  const today = new Date()
  const days = []

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - index)
    days.push(date)
  }

  return days
}

function formatDuration(totalMinutes) {
  if (!totalMinutes) return '0m'

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours && minutes) return `${hours}h ${minutes}m`
  if (hours) return `${hours}h`
  return `${minutes}m`
}

function StatCard({ label, value, valueClassName }) {
  return (
    <div className="flex-1 rounded-xl bg-gray-100 p-3 dark:bg-gray-800">
      <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={['text-xl font-bold', valueClassName].join(' ')}>{value}</p>
    </div>
  )
}

function ComingSoonTab({ label }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900">
      <BarChart2 className="h-10 w-10 text-gray-300 dark:text-gray-600" />
      <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{label}</p>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Coming soon</p>
    </div>
  )
}

function ThisWeekTab({ entries, loading, error }) {
  const weekDates = useMemo(() => getLastSevenDays(), [])

  const stats = useMemo(() => {
    const productiveMinutes = entries.reduce((sum, entry) => {
      if (entry.category === 'Learning' || entry.category === 'Work') {
        return sum + (entry.duration_mins || 0)
      }

      return sum
    }, 0)

    const socialEntries = entries.filter((entry) => entry.category === 'Social Media')
    const socialMediaMinutes = socialEntries.reduce(
      (sum, entry) => sum + (entry.duration_mins || 0),
      0
    )
    const regretEntries = socialEntries.filter((entry) => entry.regret === true).length

    return {
      productive: `${(productiveMinutes / 60).toFixed(1)}h`,
      socialMedia: `${(socialMediaMinutes / 60).toFixed(1)}h`,
      regretRate: socialEntries.length ? `${Math.round((regretEntries / socialEntries.length) * 100)}%` : 'N/A',
    }
  }, [entries])

  const chartData = useMemo(() => {
    const chartMap = new Map(
      weekDates.map((date) => [
        formatDateKey(date),
        {
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          Learning: 0,
          Work: 0,
          'Social Media': 0,
          'Self-care': 0,
          Other: 0,
        },
      ])
    )

    entries.forEach((entry) => {
      const dayData = chartMap.get(entry.date)
      if (!dayData) return

      const category = CHART_KEYS.includes(entry.category) ? entry.category : 'Other'
      dayData[category] += (entry.duration_mins || 0) / 60
    })

    return weekDates.map((date) => chartMap.get(formatDateKey(date)))
  }, [entries, weekDates])

  const topActivities = useMemo(() => {
    const activityMap = new Map()

    entries.forEach((entry) => {
      const key = entry.activity_name || 'Untitled'
      const existing = activityMap.get(key)

      if (existing) {
        existing.duration += entry.duration_mins || 0
        return
      }

      activityMap.set(key, {
        name: key,
        duration: entry.duration_mins || 0,
        category: entry.category || 'Other',
      })
    })

    return Array.from(activityMap.values())
      .sort((left, right) => right.duration - left.duration)
      .slice(0, 3)
  }, [entries])

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500 dark:border-gray-700 dark:border-t-blue-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
        {error}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900">
        <BarChart2 className="h-12 w-12 text-gray-300 dark:text-gray-600" />
        <p className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">No data yet this week</p>
        <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          Start logging your day to see patterns here
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-3 gap-3">
        <StatCard label="Productive" value={stats.productive} valueClassName="text-blue-500 dark:text-blue-400" />
        <StatCard
          label="Social Media"
          value={stats.socialMedia}
          valueClassName="text-amber-500 dark:text-amber-400"
        />
        <StatCard label="Regret Rate" value={stats.regretRate} valueClassName="text-red-500 dark:text-red-400" />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Time by day</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your last 7 days, stacked by category.</p>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="h" />
            <Tooltip formatter={(value) => `${Number(value).toFixed(1)}h`} />
            <Legend />
            <Bar dataKey="Learning" stackId="a" fill="#3B82F6" />
            <Bar dataKey="Work" stackId="a" fill="#14B8A6" />
            <Bar dataKey="Social Media" stackId="a" fill="#F59E0B" />
            <Bar dataKey="Self-care" stackId="a" fill="#8B5CF6" />
            <Bar dataKey="Other" stackId="a" fill="#6B7280" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top 3 activities this week</h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {topActivities.map((activity) => {
            const color = CATEGORY_COLORS[activity.category] || CATEGORY_COLORS.Other

            return (
              <div key={activity.name} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {activity.name}
                  </p>
                </div>
                <p className="shrink-0 text-sm text-gray-500 dark:text-gray-400">
                  {formatDuration(activity.duration)}
                </p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default function InsightsScreen() {
  const [activeTab, setActiveTab] = useState('This Week')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadEntries() {
      setLoading(true)
      setError('')

      const today = new Date()
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(today.getDate() - 6)
      const fromDate = sevenDaysAgo.toISOString().split('T')[0]
      const toDate = today.toISOString().split('T')[0]

      const { data, error: fetchError } = await supabase
        .from('entries')
        .select('*')
        .gte('date', fromDate)
        .lte('date', toDate)
        .order('date', { ascending: true })

      if (!isMounted) return

      if (fetchError) {
        setError(fetchError.message || 'Could not load insights')
        setEntries([])
        setLoading(false)
        return
      }

      setEntries(data || [])
      setLoading(false)
    }

    void loadEntries()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Insights
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Weekly patterns, comparisons, and trends from the time you log.
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full rounded-2xl bg-gray-100 p-1 dark:bg-gray-800">
          {TABS.map((tab) => {
            const isActive = tab === activeTab

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={[
                  'min-h-11 flex-1 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400',
                ].join(' ')}
              >
                {tab}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab === 'This Week' ? (
        <ThisWeekTab entries={entries} loading={loading} error={error} />
      ) : (
        <ComingSoonTab label={activeTab} />
      )}
    </div>
  )
}
