import { useMemo, useState } from 'react'
import { getStoredPresetConfig, mergePresets } from '../constants/presets'
import { supabase } from '../lib/supabase'

const MOODS = ['😞', '😕', '😐', '🙂', '😄']
const TRIGGERS = ['Boredom', 'Habit', 'Notification', 'Break', 'Planned', 'Other']
const LOCATIONS = ['Bed', 'Desk', 'Couch', 'Outside', 'Commute', 'Uni', 'Work']
const DEVICES = ['Mobile', 'Desktop', 'Both']
const RESOURCE_TYPES = ['Video', 'Book', 'Article', 'Course', 'Practice', 'Lecture']
const UNDERSTOOD_OPTIONS = ['Yes', 'Partial', 'No']

function getCurrentTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function getDurationMins(startTime, endTime) {
  if (!startTime || !endTime) return null

  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  const startTotal = startHour * 60 + startMinute
  const endTotal = endHour * 60 + endMinute

  if (Number.isNaN(startTotal) || Number.isNaN(endTotal) || endTotal <= startTotal) {
    return null
  }

  return endTotal - startTotal
}

function formatDuration(durationMins) {
  if (!durationMins) return '0m'

  const hours = Math.floor(durationMins / 60)
  const minutes = durationMins % 60

  if (hours && minutes) return `${hours}h ${minutes}m`
  if (hours) return `${hours}h`
  return `${minutes}m`
}

function getInitialFormState(startTime, endTime) {
  return {
    activityName: '',
    startTime,
    endTime,
    energyBefore: 0,
    energyAfter: 0,
    mood: 0,
    focusQuality: 0,
    trigger: '',
    location: '',
    device: '',
    planned: false,
    regret: false,
    topic: '',
    resourceType: '',
    understood: '',
    note: '',
  }
}

function SectionCard({ title, children, subtitle }) {
  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function FieldLabel({ children }) {
  return (
    <label className="mb-2 block text-sm font-medium text-gray-500 dark:text-gray-400">
      {children}
    </label>
  )
}

function RatingStars({ value, onChange }) {
  return (
    <div className="flex justify-start gap-2">
      {Array.from({ length: 5 }, (_, index) => {
        const rating = index + 1
        const isSelected = rating <= value

        return (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(value === rating ? 0 : rating)}
            className="flex h-10 min-h-10 w-10 min-w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-2xl transition dark:border-gray-700 dark:bg-gray-950"
            aria-label={`Select ${rating} star${rating > 1 ? 's' : ''}`}
          >
            <span className={isSelected ? 'text-yellow-400' : 'text-gray-300'}>
              ★
            </span>
          </button>
        )
      })}
    </div>
  )
}

function ChipRow({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = option === value

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(isActive ? '' : option)}
            className={[
              'min-h-12 rounded-full border px-3 py-2 text-sm font-medium transition',
              isActive
                ? 'border-blue-500 bg-blue-500 text-white'
                : 'border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300',
            ].join(' ')}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left dark:border-gray-700 dark:bg-gray-950"
      aria-pressed={checked}
    >
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
      <span
        className={[
          'relative inline-flex h-7 w-12 rounded-full transition',
          checked ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-700',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition',
            checked ? 'left-6' : 'left-1',
          ].join(' ')}
        />
      </span>
    </button>
  )
}

export default function LogScreen() {
  const currentTime = useMemo(() => getCurrentTime(), [])
  const initialStartTime = useMemo(
    () => localStorage.getItem('lastEndTime') || currentTime,
    [currentTime]
  )
  const presets = useMemo(() => mergePresets(getStoredPresetConfig()), [])
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [form, setForm] = useState(() => getInitialFormState(initialStartTime, currentTime))
  const [error, setError] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [loading, setLoading] = useState(false)

  const selectedCategory = selectedPreset?.category || null
  const selectedSubcategory = selectedPreset?.subcategory || null
  const durationMins = getDurationMins(form.startTime, form.endTime)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
  }

  function handlePresetClick(preset) {
    const isDeselecting = selectedPreset?.name === preset.name

    if (isDeselecting) {
      setSelectedPreset(null)
      setForm((current) => ({
        ...current,
        activityName: current.activityName === preset.name ? '' : current.activityName,
        focusQuality: 0,
        regret: false,
        topic: '',
        resourceType: '',
        understood: '',
      }))
      setError('')
      return
    }

    setSelectedPreset(preset)
    setForm((current) => ({
      ...current,
      activityName: preset.name === 'Other' ? current.activityName : preset.name,
      focusQuality:
        preset.category === 'Learning' || preset.category === 'Work' ? current.focusQuality : 0,
      regret: preset.category === 'Social Media' ? current.regret : false,
      topic: preset.category === 'Learning' ? current.topic : '',
      resourceType: preset.category === 'Learning' ? current.resourceType : '',
      understood: preset.category === 'Learning' ? current.understood : '',
    }))
    setError('')
  }

  async function handleSave(event) {
    event.preventDefault()

    const activityName = form.activityName
    const startTime = form.startTime
    const endTime = form.endTime
    const energyBefore = form.energyBefore
    const energyAfter = form.energyAfter
    const mood = form.mood
    const focusQuality = form.focusQuality
    const trigger = form.trigger
    const location = form.location
    const device = form.device
    const isPlanned = form.planned
    const regret = form.regret
    const topic = form.topic
    const resourceType = form.resourceType
    const understood = form.understood
    const note = form.note

    if (!selectedPreset && !activityName.trim()) {
      setError('Please select an activity')
      return
    }

    if (!startTime || !endTime) {
      setError('Please set start and end time')
      return
    }

    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    const totalDurationMins = eh * 60 + em - (sh * 60 + sm)

    if (totalDurationMins <= 0) {
      setError('End time must be after start time')
      return
    }

    setError('')
    setLoading(true)

    const today = new Date().toISOString().split('T')[0]

    const { data, error: insertError } = await supabase
      .from('entries')
      .insert([{
        date: today,
        start_time: startTime,
        end_time: endTime,
        duration_mins: totalDurationMins,
        activity_name: selectedPreset?.name || activityName.trim(),
        category: selectedPreset?.category || 'Other',
        subcategory: selectedPreset?.subcategory || null,
        energy_before: energyBefore || null,
        energy_after: energyAfter || null,
        mood: mood || null,
        focus_quality: focusQuality || null,
        trigger: trigger || null,
        location: location || null,
        device: device || null,
        is_planned: isPlanned || false,
        regret: regret || false,
        topic: topic || null,
        resource_type: resourceType || null,
        understood: understood || null,
        note: note.trim() || null,
      }])
      .select()

    setLoading(false)

    if (insertError) {
      console.error('Save error:', insertError.message)
      setError(`Failed to save: ${insertError.message}`)
      return
    }

    console.log('Entry saved!', data)
    localStorage.setItem('lastEndTime', endTime)
    setShowToast(true)
    window.setTimeout(() => setShowToast(false), 2000)

    setSelectedPreset(null)
    setForm({
      activityName: '',
      startTime: endTime,
      endTime: getCurrentTime(),
      energyBefore: 0,
      energyAfter: 0,
      mood: 0,
      focusQuality: 0,
      trigger: '',
      location: '',
      device: '',
      planned: false,
      regret: false,
      topic: '',
      resourceType: '',
      understood: '',
      note: '',
    })
  }

  return (
    <div className="w-full overflow-x-hidden px-4">
      <div className="mx-auto flex w-full max-w-3xl flex-col">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Log
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Tap a preset for speed, adjust the details, and save the entry to your timeline.
          </p>
        </div>

        <SectionCard
          title="Quick Presets"
          subtitle="Choose a recent activity or leave it unselected and type your own."
        >
          <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
            {presets.map((preset) => {
              const isSelected = selectedPreset?.name === preset.name

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={[
                    'flex min-h-20 flex-col items-center justify-center rounded-xl border border-gray-200 p-2 text-center transition dark:border-gray-700',
                    isSelected
                      ? 'border-2 border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-white text-gray-700 dark:bg-gray-950 dark:text-gray-200',
                  ].join(' ')}
                >
                  <span className="text-2xl">{preset.emoji}</span>
                  <span className="mt-1 w-full truncate text-center text-xs font-medium">
                    {preset.name}
                  </span>
                </button>
              )
            })}
          </div>
        </SectionCard>

        <form onSubmit={handleSave} className="flex flex-col">
          <SectionCard title="Details">
            <div className="grid gap-4">
              <div>
                <FieldLabel>Activity name</FieldLabel>
                <input
                  type="text"
                  value={form.activityName}
                  onChange={(event) => updateField('activityName', event.target.value)}
                  placeholder="What did you do?"
                  className="min-h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              {(selectedCategory || selectedSubcategory) && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-950">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                      Category
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                      {selectedCategory}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-950">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                      Subcategory
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                      {selectedSubcategory}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Time">
            <div className="flex flex-col gap-4">
              <div>
                <FieldLabel>Start time</FieldLabel>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(event) => updateField('startTime', event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-100 p-3 text-base text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-center dark:border-blue-500/20 dark:bg-blue-500/10">
                <span className="text-sm text-blue-700 dark:text-blue-300">↓</span>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  Duration: <span className="font-semibold">{formatDuration(durationMins)}</span>
                </p>
              </div>

              <div>
                <FieldLabel>End time</FieldLabel>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(event) => updateField('endTime', event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-100 p-3 text-base text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Context">
            <div className="grid gap-5">
              <div>
                <FieldLabel>Energy before</FieldLabel>
                <RatingStars value={form.energyBefore} onChange={(value) => updateField('energyBefore', value)} />
              </div>

              <div>
                <FieldLabel>Energy after</FieldLabel>
                <RatingStars value={form.energyAfter} onChange={(value) => updateField('energyAfter', value)} />
              </div>

              <div>
                <FieldLabel>Mood</FieldLabel>
                <div className="flex flex-wrap justify-start gap-3">
                  {MOODS.map((emoji, index) => {
                    const moodValue = index + 1
                    const isSelected = form.mood === moodValue

                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => updateField('mood', isSelected ? 0 : moodValue)}
                        className={[
                          'flex min-h-11 min-w-11 items-center justify-center rounded-full border bg-white text-2xl transition dark:bg-gray-950',
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-500'
                            : 'border-gray-200 dark:border-gray-700',
                        ].join(' ')}
                        aria-label={`Mood ${moodValue}`}
                      >
                        {emoji}
                      </button>
                    )
                  })}
                </div>
              </div>

              {(selectedCategory === 'Learning' || selectedCategory === 'Work') && (
                <div>
                  <FieldLabel>Focus quality</FieldLabel>
                  <RatingStars
                    value={form.focusQuality}
                    onChange={(value) => updateField('focusQuality', value)}
                  />
                </div>
              )}

              <div>
                <FieldLabel>Trigger</FieldLabel>
                <ChipRow options={TRIGGERS} value={form.trigger} onChange={(value) => updateField('trigger', value)} />
              </div>

              <div>
                <FieldLabel>Location</FieldLabel>
                <ChipRow options={LOCATIONS} value={form.location} onChange={(value) => updateField('location', value)} />
              </div>

              <div>
                <FieldLabel>Device</FieldLabel>
                <ChipRow options={DEVICES} value={form.device} onChange={(value) => updateField('device', value)} />
              </div>

              <Toggle
                checked={form.planned}
                onChange={(value) => updateField('planned', value)}
                label="Was this planned?"
              />

              {selectedCategory === 'Social Media' && (
                <Toggle
                  checked={form.regret}
                  onChange={(value) => updateField('regret', value)}
                  label="Did you regret this?"
                />
              )}

              {selectedCategory === 'Learning' && (
                <div className="grid gap-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-950">
                  <div>
                    <FieldLabel>Topic</FieldLabel>
                    <input
                      type="text"
                      value={form.topic}
                      onChange={(event) => updateField('topic', event.target.value)}
                      placeholder="e.g. Gradient Descent"
                      className="min-h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
                    />
                  </div>

                  <div>
                    <FieldLabel>Resource type</FieldLabel>
                    <ChipRow
                      options={RESOURCE_TYPES}
                      value={form.resourceType}
                      onChange={(value) => updateField('resourceType', value)}
                    />
                  </div>

                  <div>
                    <FieldLabel>Understood</FieldLabel>
                    <div className="grid grid-cols-3 gap-2">
                      {UNDERSTOOD_OPTIONS.map((option) => {
                        const isActive = form.understood === option

                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => updateField('understood', isActive ? '' : option)}
                            className={[
                              'min-h-12 rounded-2xl border px-4 py-3 text-sm font-medium transition',
                              isActive
                                ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500'
                                : 'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200',
                            ].join(' ')}
                          >
                            {option}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <FieldLabel>Note</FieldLabel>
                <textarea
                  value={form.note}
                  onChange={(event) => updateField('note', event.target.value)}
                  placeholder="Any notes... (optional)"
                  rows={4}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
            </div>
          </SectionCard>

          {error ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          ) : null}

          <div className="sticky bottom-20 z-10 mt-4 mb-6 bg-gray-50/95 pb-4 pt-2 backdrop-blur dark:bg-gray-950/95 md:bottom-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-500 px-4 py-4 text-base font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>

      {showToast ? (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-green-500 px-6 py-3 text-white shadow-lg">
          Entry saved!
        </div>
      ) : null}
    </div>
  )
}
