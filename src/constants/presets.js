export const DEFAULT_PRESETS = [
  { id: 'instagram', name: 'Instagram', emoji: '📱', category: 'Social Media', subcategory: 'Instagram' },
  { id: 'youtube', name: 'YouTube', emoji: '▶️', category: 'Social Media', subcategory: 'YouTube' },
  { id: 'ml-study', name: 'ML Study', emoji: '🧠', category: 'Learning', subcategory: 'Machine Learning' },
  { id: 'coding', name: 'Coding', emoji: '💻', category: 'Work', subcategory: 'Coding' },
  { id: 'university', name: 'University', emoji: '🎓', category: 'Learning', subcategory: 'University' },
  { id: 'part-time-job', name: 'Part-time Job', emoji: '💼', category: 'Work', subcategory: 'Job' },
  { id: 'reading', name: 'Reading', emoji: '📚', category: 'Learning', subcategory: 'Books' },
  { id: 'exercise', name: 'Exercise', emoji: '🏃', category: 'Self-care', subcategory: 'Exercise' },
  { id: 'eating-cooking', name: 'Eating/Cooking', emoji: '🍳', category: 'Self-care', subcategory: 'Food' },
  { id: 'cleaning', name: 'Cleaning', emoji: '🧹', category: 'Self-care', subcategory: 'Chores' },
  { id: 'sleep-rest', name: 'Sleep/Rest', emoji: '😴', category: 'Self-care', subcategory: 'Sleep' },
  { id: 'other', name: 'Other', emoji: '➕', category: 'Other', subcategory: 'Other' },
]

export const PRESET_CATEGORIES = ['Learning', 'Work', 'Social Media', 'Self-care', 'Other']

export const CUSTOM_PRESETS_STORAGE_KEY = 'customPresets'

export function getStoredPresetConfig() {
  if (typeof window === 'undefined') return []

  try {
    const rawValue = window.localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY)
    if (!rawValue) return []

    const parsedValue = JSON.parse(rawValue)
    return Array.isArray(parsedValue) ? parsedValue : []
  } catch {
    return []
  }
}

export function saveStoredPresetConfig(config) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(config))
}

export function mergePresets(config = []) {
  const overrides = new Map()
  const deletedDefaultIds = new Set()
  const customPresets = []

  config.forEach((item) => {
    if (item?.kind === 'override' && item.baseId) {
      overrides.set(item.baseId, item)
      return
    }

    if (item?.kind === 'delete' && item.baseId) {
      deletedDefaultIds.add(item.baseId)
      return
    }

    if (item?.kind === 'custom') {
      customPresets.push(item)
    }
  })

  const mergedDefaults = DEFAULT_PRESETS
    .filter((preset) => !deletedDefaultIds.has(preset.id))
    .map((preset) => {
      const override = overrides.get(preset.id)
      return override
        ? {
            ...preset,
            ...override,
            id: preset.id,
            source: 'default',
          }
        : {
            ...preset,
            source: 'default',
          }
    })

  const mergedCustoms = customPresets.map((preset) => ({
    ...preset,
    source: 'custom',
  }))

  return [...mergedDefaults, ...mergedCustoms]
}
