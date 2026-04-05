import { useEffect, useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart2, Calendar, Moon, Sunrise, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'

const TABS = ['This Week', 'Heatmap', 'Week vs Week', 'Patterns']

const CATEGORY_COLORS = {
  Learning: '#3B82F6',
  Work: '#14B8A6',
  'Social Media': '#F59E0B',
  'Self-care': '#8B5CF6',
  Other: '#6B7280',
}
const TRIGGER_COLORS = {
  Boredom: '#EF4444',
  Habit: '#F59E0B',
  Notification: '#8B5CF6',
  Break: '#3B82F6',
  Planned: '#14B8A6',
  Other: '#6B7280',
}

const CHART_KEYS = ['Learning', 'Work', 'Social Media', 'Self-care', 'Other']
const HEATMAP_DAYS = [
  { key: 1, short: 'Mo', long: 'Monday' },
  { key: 2, short: 'Tu', long: 'Tuesday' },
  { key: 3, short: 'We', long: 'Wednesday' },
  { key: 4, short: 'Th', long: 'Thursday' },
  { key: 5, short: 'Fr', long: 'Friday' },
  { key: 6, short: 'Sa', long: 'Saturday' },
  { key: 0, short: 'Su', long: 'Sunday' },
]
const HEATMAP_HOURS = Array.from({ length: 18 }, (_, index) => index + 6)

function formatHourLabel(hour) {
  if (hour === 0) return '12am'
  if (hour < 12) return `${hour}am`
  if (hour === 12) return '12pm'
  return `${hour - 12}pm`
}

function formatRange(start, end) {
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

function getCellColor(minutes, type) {
  if (!minutes || minutes === 0) return 'bg-gray-100 dark:bg-gray-800'

  const baseColor = type === 'productive' ? '#3B82F6' : '#F59E0B'

  if (minutes < 15) return { backgroundColor: baseColor, opacity: 0.15 }
  if (minutes < 30) return { backgroundColor: baseColor, opacity: 0.3 }
  if (minutes < 45) return { backgroundColor: baseColor, opacity: 0.45 }
  if (minutes < 60) return { backgroundColor: baseColor, opacity: 0.6 }
  if (minutes < 90) return { backgroundColor: baseColor, opacity: 0.75 }
  return { backgroundColor: baseColor, opacity: 1 }
}

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

function getTotalHours(entries, categories) {
  const mins = entries
    .filter((entry) => categories.includes(entry.category))
    .reduce((sum, entry) => sum + (entry.duration_mins || 0), 0)

  return (mins / 60).toFixed(1)
}

function getAvgRating(summaries) {
  const rated = summaries.filter((summary) => summary.day_rating)
  if (!rated.length) return 'N/A'

  const avg = rated.reduce((sum, summary) => sum + summary.day_rating, 0) / rated.length
  return avg.toFixed(1)
}

function getGoalsMet(summaries) {
  return summaries.filter((summary) => summary.daily_goal_met === true).length
}

function getTrend(current, last, lowerIsBetter = false) {
  const curr = parseFloat(current)
  const prev = parseFloat(last)

  if (Number.isNaN(curr) || Number.isNaN(prev) || curr === prev) {
    return { arrow: '→', color: 'text-gray-400' }
  }

  const improved = lowerIsBetter ? curr < prev : curr > prev
  const pct = prev > 0 ? Math.abs(((curr - prev) / prev) * 100).toFixed(0) : 0

  return improved
    ? { arrow: `↑ ${pct}%`, color: 'text-green-500' }
    : { arrow: `↓ ${pct}%`, color: 'text-red-500' }
}

function getBestDay(summaries) {
  const rated = summaries.filter((summary) => summary.day_rating)
  if (!rated.length) return null

  return rated.reduce((best, summary) =>
    !best || summary.day_rating > best.day_rating ? summary : best
  , null)
}

function roundToNearestHalfHour(time) {
  if (!time) return null
  const [hourString, minuteString] = time.split(':')
  const hours = Number(hourString)
  const minutes = Number(minuteString)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null

  const totalMinutes = hours * 60 + minutes
  const roundedMinutes = Math.round(totalMinutes / 30) * 30
  const roundedHours = Math.floor(roundedMinutes / 60) % 24
  const finalMinutes = roundedMinutes % 60

  return `${String(roundedHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`
}

function formatClockTime(time) {
  if (!time) return 'N/A'
  const [hourString, minuteString] = time.split(':')
  const hours = Number(hourString)
  const minutes = Number(minuteString)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time

  const displayHours = hours % 12 || 12
  const suffix = hours >= 12 ? 'pm' : 'am'

  return `${displayHours}:${String(minutes).padStart(2, '0')}${suffix}`
}

function renderStars(value) {
  const rounded = Math.max(0, Math.min(5, Math.round(value)))
  return `${'★'.repeat(rounded)}${'☆'.repeat(5 - rounded)}`
}

function StatCard({ label, value, valueClassName }) {
  return (
    <div className="flex-1 rounded-xl bg-gray-100 p-3 dark:bg-gray-800">
      <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={['text-xl font-bold', valueClassName].join(' ')}>{value}</p>
    </div>
  )
}

function PatternCard({ title, children }) {
  return (
    <section className="mb-4 rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </h2>
      {children}
    </section>
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

function PatternsTab({ entries, summaries }) {
  const socialEntries = useMemo(
    () => entries.filter((entry) => entry.category === 'Social Media'),
    [entries]
  )

  const triggerData = useMemo(() => {
    const triggerCounts = new Map()

    socialEntries.forEach((entry) => {
      if (!entry.trigger) return
      triggerCounts.set(entry.trigger, (triggerCounts.get(entry.trigger) || 0) + 1)
    })

    return Array.from(triggerCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((left, right) => right.value - left.value)
  }, [socialEntries])

  const topTrigger = triggerData[0] || null

  const energyEntries = useMemo(
    () =>
      entries.filter(
        (entry) => entry.energy_before !== null && entry.energy_after !== null
      ),
    [entries]
  )

  const energyData = useMemo(() => {
    const groups = new Map()

    energyEntries.forEach((entry) => {
      const category = entry.category || 'Other'
      const current = groups.get(category) || { total: 0, count: 0 }
      current.total += entry.energy_after - entry.energy_before
      current.count += 1
      groups.set(category, current)
    })

    return Array.from(groups.entries()).map(([category, value]) => ({
      category,
      delta: Number((value.total / value.count).toFixed(1)),
    }))
  }, [energyEntries])

  const moodEntries = useMemo(
    () => entries.filter((entry) => entry.mood !== null),
    [entries]
  )

  const moodData = useMemo(() => {
    const groups = new Map()

    moodEntries.forEach((entry) => {
      const category = entry.category || 'Other'
      const current = groups.get(category) || { total: 0, count: 0 }
      current.total += entry.mood
      current.count += 1
      groups.set(category, current)
    })

    return Array.from(groups.entries())
      .map(([category, value]) => ({
        category,
        avgMood: Number((value.total / value.count).toFixed(1)),
      }))
      .sort((left, right) => right.avgMood - left.avgMood)
  }, [moodEntries])

  const bestDaySummaries = useMemo(
    () => summaries.filter((summary) => (summary.day_rating || 0) >= 8),
    [summaries]
  )

  const bestDayTemplate = useMemo(() => {
    if (bestDaySummaries.length < 3) return null

    const wakeTimes = new Map()

    bestDaySummaries.forEach((summary) => {
      const roundedWakeTime = roundToNearestHalfHour(summary.wake_time)
      if (!roundedWakeTime) return
      wakeTimes.set(roundedWakeTime, (wakeTimes.get(roundedWakeTime) || 0) + 1)
    })

    const mostCommonWakeTime =
      Array.from(wakeTimes.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] || null

    const averageSleepQuality =
      bestDaySummaries.reduce((sum, summary) => sum + (summary.sleep_quality || 0), 0) /
      bestDaySummaries.length

    const productiveMinutesByBestDay = bestDaySummaries.reduce((sum, summary) => {
      const dayProductiveMinutes = entries
        .filter(
          (entry) =>
            entry.date === summary.date &&
            (entry.category === 'Learning' || entry.category === 'Work')
        )
        .reduce((entrySum, entry) => entrySum + (entry.duration_mins || 0), 0)

      return sum + dayProductiveMinutes
    }, 0)

    return {
      wakeTime: formatClockTime(mostCommonWakeTime),
      sleepQuality: Number(averageSleepQuality.toFixed(1)),
      productiveHours: (productiveMinutesByBestDay / bestDaySummaries.length / 60).toFixed(1),
      count: bestDaySummaries.length,
    }
  }, [bestDaySummaries, entries])

  const focusEntries = useMemo(
    () =>
      entries.filter(
        (entry) => entry.focus_quality !== null && entry.location !== null
      ),
    [entries]
  )

  const focusData = useMemo(() => {
    const groups = new Map()

    focusEntries.forEach((entry) => {
      const current = groups.get(entry.location) || { total: 0, count: 0 }
      current.total += entry.focus_quality
      current.count += 1
      groups.set(entry.location, current)
    })

    return Array.from(groups.entries())
      .map(([location, value]) => ({
        location,
        avgFocus: Number((value.total / value.count).toFixed(1)),
      }))
      .sort((left, right) => right.avgFocus - left.avgFocus)
  }, [focusEntries])

  const plannedBreakdown = useMemo(() => {
    if (entries.length < 10) return null

    const plannedMinutes = entries
      .filter((entry) => entry.is_planned === true)
      .reduce((sum, entry) => sum + (entry.duration_mins || 0), 0)
    const unplannedMinutes = entries
      .filter((entry) => entry.is_planned === false)
      .reduce((sum, entry) => sum + (entry.duration_mins || 0), 0)
    const totalMinutes = plannedMinutes + unplannedMinutes
    const plannedPercent = totalMinutes ? Math.round((plannedMinutes / totalMinutes) * 100) : 0

    return {
      plannedPercent,
      impulsivePercent: 100 - plannedPercent,
    }
  }, [entries])

  return (
    <div>
      <PatternCard title="What triggers your social media?">
        {socialEntries.length < 3 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Log more social media sessions to see trigger patterns
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={triggerData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {triggerData.map((entry) => (
                    <Cell key={entry.name} fill={TRIGGER_COLORS[entry.name] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            {topTrigger ? (
              <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
                Your #1 trigger is {topTrigger.name} ({topTrigger.value} sessions)
              </div>
            ) : null}
          </>
        )}
      </PatternCard>

      <PatternCard title="Which activities energise vs drain you?">
        {energyEntries.length < 5 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Fill in energy levels when logging to see this insight
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={energyData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[-4, 4]} />
                <Tooltip formatter={(value) => [Number(value).toFixed(1), 'Energy change']} />
                <ReferenceLine y={0} stroke="#9CA3AF" />
                <Bar dataKey="delta" radius={[4, 4, 0, 0]}>
                  {energyData.map((entry) => (
                    <Cell
                      key={entry.category}
                      fill={entry.delta >= 0 ? '#10B981' : '#EF4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {energyData.length
                ? `${energyData
                    .slice()
                    .sort((left, right) => right.delta - left.delta)[0].category} gives you the strongest average energy lift.`
                : 'Fill in energy levels when logging to see this insight'}
            </p>
          </>
        )}
      </PatternCard>

      <PatternCard title="Mood impact by activity">
        {moodEntries.length < 5 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Log your mood when tracking to see this insight
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={moodData}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
              >
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={70} />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}/5`, 'Avg mood']} />
                <Bar dataKey="avgMood" radius={[0, 4, 4, 0]}>
                  {moodData.map((entry) => (
                    <Cell
                      key={entry.category}
                      fill={CATEGORY_COLORS[entry.category] || '#6B7280'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {moodData.length
                ? `${moodData[0].category} has your highest average mood at ${moodData[0].avgMood}/5.`
                : 'Log your mood when tracking to see this insight'}
            </p>
          </>
        )}
      </PatternCard>

      <PatternCard title="Your best day template">
        {bestDayTemplate ? (
          <>
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                On your best days you typically...
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Sunrise className="h-4 w-4" />
                    <span>Wake up</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {bestDayTemplate.wakeTime}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Moon className="h-4 w-4" />
                    <span>Sleep quality</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {renderStars(bestDayTemplate.sleepQuality)} {bestDayTemplate.sleepQuality}/5
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Zap className="h-4 w-4" />
                    <span>Productive hours</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {bestDayTemplate.productiveHours}h
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>Based on</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {bestDayTemplate.count} days rated 8+
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Your strongest days already show a repeatable pattern.
            </p>
          </>
        ) : (
          <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <p>🔒</p>
            <p className="mt-2">
              Rate at least 3 days as 8/10 or higher to unlock your best day template
            </p>
          </div>
        )}
      </PatternCard>

      <PatternCard title="Focus by location">
        {focusEntries.length < 5 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Log focus quality and location to see where you work best
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {focusData.map((entry, index) => {
                const rank = ['🥇', '🥈', '🥉'][index] || `${index + 1}.`

                return (
                  <p key={entry.location} className="text-sm text-gray-700 dark:text-gray-300">
                    {rank} {entry.location} {renderStars(entry.avgFocus)} {entry.avgFocus}/5
                  </p>
                )
              })}
            </div>

            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {focusData.length
                ? `${focusData[0].location} is currently your best focus environment.`
                : 'Log focus quality and location to see where you work best'}
            </p>
          </>
        )}
      </PatternCard>

      <PatternCard title="Planned vs impulsive time">
        {plannedBreakdown ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-green-50 p-4 text-center dark:bg-green-900/20">
                <p className="text-sm text-green-600 dark:text-green-400">Planned</p>
                <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                  {plannedBreakdown.plannedPercent}%
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 p-4 text-center dark:bg-amber-900/20">
                <p className="text-sm text-amber-600 dark:text-amber-400">Impulsive</p>
                <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {plannedBreakdown.impulsivePercent}%
                </p>
              </div>
            </div>

            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div className="flex h-full">
                <div
                  className="bg-green-500"
                  style={{ width: `${plannedBreakdown.plannedPercent}%` }}
                />
                <div
                  className="bg-amber-500"
                  style={{ width: `${plannedBreakdown.impulsivePercent}%` }}
                />
              </div>
            </div>

            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {plannedBreakdown.plannedPercent >= plannedBreakdown.impulsivePercent
                ? 'Most of your time is lining up with your intent.'
                : 'Impulsive time is currently taking the larger share.'}
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Log at least 10 entries to see this breakdown
          </p>
        )}
      </PatternCard>
    </div>
  )
}

function WeekVsWeekTab({ entries, summaries }) {
  const comparisonData = useMemo(() => {
    const today = new Date()
    const currentDayOfWeek = today.getDay()
    const daysToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1

    const thisMonday = new Date(today)
    thisMonday.setDate(today.getDate() - daysToMonday)

    const lastMonday = new Date(thisMonday)
    lastMonday.setDate(thisMonday.getDate() - 7)

    const lastSunday = new Date(thisMonday)
    lastSunday.setDate(thisMonday.getDate() - 1)

    const thisMondayStr = thisMonday.toISOString().split('T')[0]
    const todayStr = today.toISOString().split('T')[0]
    const lastMondayStr = lastMonday.toISOString().split('T')[0]
    const lastSundayStr = lastSunday.toISOString().split('T')[0]

    const thisWeekEntries = entries.filter(
      (entry) => entry.date >= thisMondayStr && entry.date <= todayStr
    )
    const lastWeekEntries = entries.filter(
      (entry) => entry.date >= lastMondayStr && entry.date <= lastSundayStr
    )

    const thisSummaries = summaries.filter(
      (summary) => summary.date >= thisMondayStr && summary.date <= todayStr
    )
    const lastSummaries = summaries.filter(
      (summary) => summary.date >= lastMondayStr && summary.date <= lastSundayStr
    )

    return {
      thisWeekEntries,
      lastWeekEntries,
      thisSummaries,
      lastSummaries,
      thisWeekRange: formatRange(thisMonday, today),
      lastWeekRange: formatRange(lastMonday, lastSunday),
    }
  }, [entries, summaries])

  const rows = useMemo(() => {
    const learningThisWeek = getTotalHours(comparisonData.thisWeekEntries, ['Learning'])
    const learningLastWeek = getTotalHours(comparisonData.lastWeekEntries, ['Learning'])
    const workThisWeek = getTotalHours(comparisonData.thisWeekEntries, ['Work'])
    const workLastWeek = getTotalHours(comparisonData.lastWeekEntries, ['Work'])
    const socialThisWeek = getTotalHours(comparisonData.thisWeekEntries, ['Social Media'])
    const socialLastWeek = getTotalHours(comparisonData.lastWeekEntries, ['Social Media'])
    const ratingThisWeek = getAvgRating(comparisonData.thisSummaries)
    const ratingLastWeek = getAvgRating(comparisonData.lastSummaries)
    const goalsThisWeek = String(getGoalsMet(comparisonData.thisSummaries))
    const goalsLastWeek = String(getGoalsMet(comparisonData.lastSummaries))

    return [
      {
        label: 'Learning hours',
        current: `${learningThisWeek}h`,
        last: `${learningLastWeek}h`,
        trend: getTrend(learningThisWeek, learningLastWeek),
      },
      {
        label: 'Work hours',
        current: `${workThisWeek}h`,
        last: `${workLastWeek}h`,
        trend: getTrend(workThisWeek, workLastWeek),
      },
      {
        label: 'Social Media hours',
        current: `${socialThisWeek}h`,
        last: `${socialLastWeek}h`,
        trend: getTrend(socialThisWeek, socialLastWeek, true),
      },
      {
        label: 'Avg day rating',
        current: ratingThisWeek,
        last: ratingLastWeek,
        trend: getTrend(ratingThisWeek, ratingLastWeek),
      },
      {
        label: 'Goals met',
        current: goalsThisWeek,
        last: goalsLastWeek,
        trend: getTrend(goalsThisWeek, goalsLastWeek),
      },
    ]
  }, [comparisonData])

  const bestThisWeek = useMemo(() => getBestDay(comparisonData.thisSummaries), [comparisonData.thisSummaries])
  const bestLastWeek = useMemo(() => getBestDay(comparisonData.lastSummaries), [comparisonData.lastSummaries])

  if (
    comparisonData.thisWeekEntries.length === 0 &&
    comparisonData.lastWeekEntries.length === 0
  ) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="text-xl font-semibold text-gray-900 dark:text-white">Not enough data yet</p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Log entries for at least 2 weeks to compare
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-2 border-b border-gray-200 px-4 py-4 dark:border-gray-800">
          <div />
          <div className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
            <p>This Week</p>
            <p className="mt-1 text-xs font-medium">{comparisonData.thisWeekRange}</p>
          </div>
          <div className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
            <p>Last Week</p>
            <p className="mt-1 text-xs font-medium">{comparisonData.lastWeekRange}</p>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {rows.map((row, index) => (
            <div
              key={row.label}
              className={[
                'grid grid-cols-[1.2fr_1fr_auto_1fr] items-center gap-3 px-4 py-3',
                index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-transparent',
              ].join(' ')}
            >
              <p className="text-sm text-gray-600 dark:text-gray-400">{row.label}</p>
              <p className="text-center text-base font-semibold text-gray-900 dark:text-white">
                {row.current}
              </p>
              <p className={['text-center text-sm font-semibold', row.trend.color].join(' ')}>
                {row.trend.arrow}
              </p>
              <p className="text-center text-base font-semibold text-gray-900 dark:text-white">
                {row.last}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex-1 rounded-xl bg-gray-100 p-4 dark:bg-gray-800">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Best day this week</p>
          {bestThisWeek ? (
            <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
              {new Date(`${bestThisWeek.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' })} {bestThisWeek.day_rating}/10
            </p>
          ) : (
            <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">Not rated yet</p>
          )}
        </div>
        <div className="flex-1 rounded-xl bg-gray-100 p-4 dark:bg-gray-800">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Best day last week</p>
          {bestLastWeek ? (
            <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
              {new Date(`${bestLastWeek.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' })} {bestLastWeek.day_rating}/10
            </p>
          ) : (
            <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">Not rated yet</p>
          )}
        </div>
      </section>
    </div>
  )
}

function HeatmapTab({ entries }) {
  const [activeMode, setActiveMode] = useState('productive')
  const [selectedCell, setSelectedCell] = useState(null)
  const legendMinutes = [0, 15, 30, 45, 60, 90]

  const heatmapEntries = useMemo(
    () =>
      entries.filter((entry) => {
        if (activeMode === 'productive') {
          return entry.category === 'Learning' || entry.category === 'Work'
        }

        return entry.category === 'Social Media'
      }),
    [activeMode, entries]
  )

  const heatmapData = useMemo(() => {
    const grid = new Map(
      HEATMAP_DAYS.map((day) => [
        day.key,
        Object.fromEntries(HEATMAP_HOURS.map((hour) => [hour, 0])),
      ])
    )

    heatmapEntries.forEach((entry) => {
      if (!entry.date || !entry.start_time) return

      const [hourString] = entry.start_time.split(':')
      const hour = Number(hourString)
      if (Number.isNaN(hour) || hour < 6 || hour > 23) return

      const date = new Date(`${entry.date}T00:00:00`)
      const dayOfWeek = date.getDay()
      const daySlots = grid.get(dayOfWeek)
      if (!daySlots) return

      daySlots[hour] += entry.duration_mins || 0
    })

    return grid
  }, [heatmapEntries])

  if (entries.length < 7) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="text-base font-medium text-gray-900 dark:text-white">
          Keep logging for 7+ days to see your heatmap pattern
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveMode('productive')
              setSelectedCell(null)
            }}
            className={[
              'rounded-full px-4 py-2 text-sm font-medium transition',
              activeMode === 'productive'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
            ].join(' ')}
          >
            Productive time
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode('social')
              setSelectedCell(null)
            }}
            className={[
              'rounded-full px-4 py-2 text-sm font-medium transition',
              activeMode === 'social'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
            ].join(' ')}
          >
            Social Media time
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <div style={{ minWidth: '320px' }}>
            <div className="grid gap-1" style={{ gridTemplateColumns: '2rem repeat(7, 2.25rem)' }}>
              <div />
              {HEATMAP_DAYS.map((day) => (
                <div
                  key={day.key}
                  className="text-center text-xs text-gray-500 dark:text-gray-400"
                >
                  {day.short}
                </div>
              ))}

              {HEATMAP_HOURS.flatMap((hour) => [
                <div
                  key={`label-${hour}`}
                  className="w-8 pr-1 text-right text-xs text-gray-500 dark:text-gray-400"
                >
                  {formatHourLabel(hour)}
                </div>,
                ...HEATMAP_DAYS.map((day) => {
                  const minutes = heatmapData.get(day.key)?.[hour] || 0
                  const label = `${day.long} ${formatHourLabel(hour)} — ${formatDuration(minutes)} ${
                    activeMode === 'productive' ? 'productive' : 'social media'
                  }`

                  return (
                    <button
                      key={`${day.key}-${hour}`}
                      type="button"
                      onClick={() => setSelectedCell(label)}
                      onMouseEnter={() => setSelectedCell(label)}
                      className={
                        minutes === 0
                          ? 'h-7 w-9 rounded-sm bg-gray-100 transition dark:bg-gray-800'
                          : 'h-7 w-9 rounded-sm transition'
                      }
                      style={minutes === 0 ? undefined : getCellColor(minutes, activeMode)}
                      aria-label={label}
                    />
                  )
                }),
              ])}
            </div>
          </div>
        </div>

        {selectedCell ? (
          <div className="mt-4 rounded-lg bg-gray-800 p-2 text-xs text-white dark:bg-gray-700">
            {selectedCell}
          </div>
        ) : null}

        <div className="mt-4">
          <div className="flex items-center gap-1">
            {legendMinutes.map((minutes) => (
              <div
                key={minutes}
                className={
                  minutes === 0
                    ? 'h-4 w-4 rounded-sm bg-gray-100 dark:bg-gray-800'
                    : 'h-4 w-4 rounded-sm'
                }
                style={minutes === 0 ? undefined : getCellColor(minutes, activeMode)}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-400">
            <span>Less</span>
            <span>More</span>
          </div>
        </div>
      </section>
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
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const weekEntries = useMemo(() => {
    const today = new Date()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(today.getDate() - 6)
    const fromDate = sevenDaysAgo.toISOString().split('T')[0]
    const toDate = today.toISOString().split('T')[0]

    return entries
      .filter((entry) => entry.date >= fromDate && entry.date <= toDate)
      .sort((left, right) => left.date.localeCompare(right.date))
  }, [entries])

  useEffect(() => {
    let isMounted = true

    async function loadEntries() {
      setLoading(true)
      setError('')

      const [entriesResult, summariesResult] = await Promise.all([
        supabase
          .from('entries')
          .select('*'),
        supabase
          .from('daily_summaries')
          .select('*'),
      ])

      if (!isMounted) return

      if (entriesResult.error) {
        setError(entriesResult.error.message || 'Could not load insights')
        setEntries([])
        setSummaries([])
        setLoading(false)
        return
      }

      if (summariesResult.error) {
        setError(summariesResult.error.message || 'Could not load insights')
        setEntries([])
        setSummaries([])
        setLoading(false)
        return
      }

      setEntries(entriesResult.data || [])
      setSummaries(summariesResult.data || [])
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
        <ThisWeekTab entries={weekEntries} loading={loading} error={error} />
      ) : activeTab === 'Heatmap' ? loading ? (
        <ThisWeekTab entries={weekEntries} loading={loading} error={error} />
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      ) : (
        <HeatmapTab entries={entries} />
      ) : activeTab === 'Week vs Week' ? loading ? (
        <ThisWeekTab entries={weekEntries} loading={loading} error={error} />
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      ) : (
        <WeekVsWeekTab entries={entries} summaries={summaries} />
      ) : activeTab === 'Patterns' ? loading ? (
        <ThisWeekTab entries={weekEntries} loading={loading} error={error} />
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      ) : (
        <PatternsTab entries={entries} summaries={summaries} />
      ) : (
        <ComingSoonTab label={activeTab} />
      )}
    </div>
  )
}
