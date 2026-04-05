import { useEffect, useMemo, useState } from 'react'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import {
  DEFAULT_PRESETS,
  PRESET_CATEGORIES,
  getStoredPresetConfig,
  mergePresets,
  saveStoredPresetConfig,
} from '../constants/presets'
import { supabase } from '../lib/supabase'
import { getStoredTheme, setTheme } from '../lib/theme'

const CATEGORY_BADGE_STYLES = {
  Learning: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  Work: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
  'Social Media': 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  'Self-care': 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  Other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
}

function SectionTitle({ children }) {
  return (
    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {children}
    </h2>
  )
}

function SectionCard({ children, danger = false }) {
  return (
    <section
      className={[
        'mb-4 rounded-xl p-4',
        danger
          ? 'border border-red-200 bg-white dark:border-red-900 dark:bg-gray-800'
          : 'border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800',
      ].join(' ')}
    >
      {children}
    </section>
  )
}

function getInitialPresetForm() {
  return {
    emoji: '',
    name: '',
    category: 'Learning',
    subcategory: '',
  }
}

function buildCsv(entries) {
  const headers = [
    'date',
    'start_time',
    'end_time',
    'duration_mins',
    'activity_name',
    'category',
    'subcategory',
    'energy_before',
    'energy_after',
    'mood',
    'focus_quality',
    'trigger',
    'location',
    'device',
    'is_planned',
    'regret',
    'topic',
    'resource_type',
    'understood',
    'note',
  ]

  const escapeCsvValue = (value) => {
    if (value === null || value === undefined) return ''
    const stringValue = String(value)
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  return [
    headers.join(','),
    ...entries.map((entry) => headers.map((header) => escapeCsvValue(entry[header])).join(',')),
  ].join('\n')
}

export default function SettingsScreen() {
  const [presetConfig, setPresetConfig] = useState(() => getStoredPresetConfig())
  const [showPresetForm, setShowPresetForm] = useState(false)
  const [editingPreset, setEditingPreset] = useState(null)
  const [presetForm, setPresetForm] = useState(getInitialPresetForm())
  const [dailyGoalInput, setDailyGoalInput] = useState(() => localStorage.getItem('dailyGoal') || '')
  const [savedGoal, setSavedGoal] = useState(() => localStorage.getItem('dailyGoal') || '')
  const [goalSaved, setGoalSaved] = useState(false)
  const [theme, setThemeState] = useState(() => getStoredTheme())
  const [toast, setToast] = useState('')
  const [exporting, setExporting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [clearingData, setClearingData] = useState(false)

  const presets = useMemo(() => mergePresets(presetConfig), [presetConfig])

  useEffect(() => {
    if (!toast) return undefined

    const timeoutId = window.setTimeout(() => setToast(''), 2000)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  useEffect(() => {
    if (!goalSaved) return undefined

    const timeoutId = window.setTimeout(() => setGoalSaved(false), 1200)
    return () => window.clearTimeout(timeoutId)
  }, [goalSaved])

  function updatePresetConfig(nextConfig) {
    setPresetConfig(nextConfig)
    saveStoredPresetConfig(nextConfig)
  }

  function openAddPresetForm() {
    setEditingPreset(null)
    setPresetForm(getInitialPresetForm())
    setShowPresetForm(true)
  }

  function openEditPresetForm(preset) {
    setEditingPreset(preset)
    setPresetForm({
      emoji: preset.emoji || '',
      name: preset.name || '',
      category: preset.category || 'Learning',
      subcategory: preset.subcategory || '',
    })
    setShowPresetForm(true)
  }

  function closePresetForm() {
    setEditingPreset(null)
    setPresetForm(getInitialPresetForm())
    setShowPresetForm(false)
  }

  function handleSavePreset(event) {
    event.preventDefault()

    const nextPreset = {
      emoji: presetForm.emoji.trim().slice(0, 2),
      name: presetForm.name.trim(),
      category: presetForm.category,
      subcategory: presetForm.subcategory.trim(),
    }

    if (!nextPreset.emoji || !nextPreset.name) return

    if (!editingPreset) {
      updatePresetConfig([
        ...presetConfig,
        {
          kind: 'custom',
          id: window.crypto.randomUUID(),
          ...nextPreset,
        },
      ])
      closePresetForm()
      return
    }

    if (editingPreset.source === 'custom') {
      updatePresetConfig(
        presetConfig.map((item) =>
          item.kind === 'custom' && item.id === editingPreset.id
            ? { ...item, ...nextPreset }
            : item
        )
      )
      closePresetForm()
      return
    }

    const filteredConfig = presetConfig.filter(
      (item) => !(item.baseId === editingPreset.id && item.kind === 'delete')
    )
    const overrideIndex = filteredConfig.findIndex(
      (item) => item.kind === 'override' && item.baseId === editingPreset.id
    )
    const overrideItem = {
      kind: 'override',
      baseId: editingPreset.id,
      ...nextPreset,
    }

    if (overrideIndex >= 0) {
      filteredConfig[overrideIndex] = overrideItem
      updatePresetConfig([...filteredConfig])
    } else {
      updatePresetConfig([...filteredConfig, overrideItem])
    }

    closePresetForm()
  }

  function handleDeletePreset(preset) {
    const confirmed = window.confirm(`Delete "${preset.name}"?`)
    if (!confirmed) return

    if (preset.source === 'custom') {
      updatePresetConfig(
        presetConfig.filter((item) => !(item.kind === 'custom' && item.id === preset.id))
      )
      return
    }

    updatePresetConfig([
      ...presetConfig.filter((item) => item.baseId !== preset.id),
      { kind: 'delete', baseId: preset.id },
    ])
  }

  function handleDailyGoalChange(value) {
    setDailyGoalInput(value)
    setSavedGoal(value)
    localStorage.setItem('dailyGoal', value)
    setGoalSaved(true)
  }

  function handleThemeSelect(nextTheme) {
    setThemeState(nextTheme)
    setTheme(nextTheme)
  }

  async function handleExport() {
    setExporting(true)

    const { data, error } = await supabase.from('entries').select('*').order('date', { ascending: true })

    setExporting(false)

    if (error) {
      setToast('Export failed')
      return
    }

    const csvContent = buildCsv(data || [])
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `life-pattern-tracker-${new Date().toISOString().split('T')[0]}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
    setToast('Data exported!')
  }

  async function handleClearAllData() {
    setClearingData(true)

    const entriesResult = await supabase
      .from('entries')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    const summariesResult = await supabase
      .from('daily_summaries')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    setClearingData(false)

    if (entriesResult.error || summariesResult.error) {
      setToast('Could not clear data')
      return
    }

    setShowDeleteConfirm(false)
    setToast('All data cleared')
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col pb-24">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Customize your presets, appearance, and data controls.
        </p>
      </div>

      <div className="mt-6">
        <SectionTitle>Quick-tap Presets</SectionTitle>
        <SectionCard>
          <div className="space-y-3">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-3 dark:border-gray-700"
              >
                <GripVertical className="h-4 w-4 shrink-0 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{preset.emoji}</span>
                    <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {preset.name}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={[
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        CATEGORY_BADGE_STYLES[preset.category] || CATEGORY_BADGE_STYLES.Other,
                      ].join(' ')}
                    >
                      {preset.category}
                    </span>
                    {preset.subcategory ? (
                      <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {preset.subcategory}
                      </span>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openEditPresetForm(preset)}
                  className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  aria-label={`Edit ${preset.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePreset(preset)}
                  className="rounded-full p-2 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                  aria-label={`Delete ${preset.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={openAddPresetForm}
            className="mt-4 rounded-xl border border-dashed border-blue-300 px-4 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950/30"
          >
            + Add preset
          </button>

          {showPresetForm ? (
            <form onSubmit={handleSavePreset} className="mt-4 grid gap-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  maxLength={2}
                  value={presetForm.emoji}
                  onChange={(event) =>
                    setPresetForm((current) => ({ ...current, emoji: event.target.value }))
                  }
                  placeholder="Emoji"
                  className="min-h-12 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <input
                  type="text"
                  value={presetForm.name}
                  onChange={(event) =>
                    setPresetForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Preset name"
                  className="min-h-12 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <select
                value={presetForm.category}
                onChange={(event) =>
                  setPresetForm((current) => ({ ...current, category: event.target.value }))
                }
                className="min-h-12 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {PRESET_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={presetForm.subcategory}
                onChange={(event) =>
                  setPresetForm((current) => ({ ...current, subcategory: event.target.value }))
                }
                placeholder="Subcategory"
                className="min-h-12 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={closePresetForm}
                  className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
        </SectionCard>

        <SectionTitle>Daily Goal</SectionTitle>
        <SectionCard>
          <div className="space-y-2">
            <input
              type="text"
              value={dailyGoalInput}
              onChange={(event) => handleDailyGoalChange(event.target.value)}
              placeholder={savedGoal || 'Study ML for 2 hours'}
              className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <div className="h-5 text-sm text-green-600 dark:text-green-400">
              {goalSaved ? 'Saved' : null}
            </div>
          </div>
        </SectionCard>

        <SectionTitle>Theme</SectionTitle>
        <SectionCard>
          <div className="grid grid-cols-3 gap-2">
            {['light', 'dark', 'system'].map((option) => {
              const isActive = theme === option

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleThemeSelect(option)}
                  className={[
                    'rounded-xl px-4 py-3 text-sm font-medium capitalize transition',
                    isActive
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
                  ].join(' ')}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </SectionCard>

        <SectionTitle>Export Data</SectionTitle>
        <SectionCard>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting}
            className="rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
          >
            {exporting ? 'Exporting...' : 'Export as CSV'}
          </button>
        </SectionCard>

        <SectionTitle>Danger Zone</SectionTitle>
        <SectionCard danger>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white"
          >
            Clear all data
          </button>

          {showDeleteConfirm ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
              <p className="text-sm text-red-700 dark:text-red-300">
                Are you sure? This will delete all your entries and summaries permanently.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-xl bg-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleClearAllData()}
                  disabled={clearingData}
                  className="rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
                >
                  {clearingData ? 'Deleting...' : 'Yes, delete all'}
                </button>
              </div>
            </div>
          ) : null}
        </SectionCard>
      </div>

      {toast ? (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
