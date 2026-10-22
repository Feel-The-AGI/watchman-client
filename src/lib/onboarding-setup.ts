export const CYCLE_CHECK_ERROR = 'Could not check whether your rotation was already saved. Nothing was marked complete. Try again.'

export const CYCLE_SAVE_ERROR = 'Your rotation could not be saved, so setup was not marked complete. Your choices are still here. Try again.'

export const ONBOARDING_COMPLETE_ERROR = 'Your rotation is saved, but setup could not be marked complete. Try again. Another rotation will not be created.'

export interface SetupPatternBlock {
  label: string
  duration: number
}

export interface SetupCycleChoice {
  pattern: SetupPatternBlock[]
  anchor_date: string
  anchor_cycle_day: number
}

export interface SetupRule {
  name: string
  rule: { type: string; value: string | number }
}

function cycleRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function samePattern(saved: unknown, chosen: SetupPatternBlock[]): boolean {
  if (!Array.isArray(saved) || saved.length !== chosen.length) return false
  return saved.every((block, index) => {
    const record = cycleRecord(block)
    if (!record) return false
    return record.label === chosen[index].label && Number(record.duration) === chosen[index].duration
  })
}

function sameAnchor(cycle: Record<string, unknown>, choice: SetupCycleChoice): boolean {
  const date = typeof cycle.anchor_date === 'string' ? cycle.anchor_date.slice(0, 10) : ''
  return date === choice.anchor_date.slice(0, 10) && Number(cycle.anchor_cycle_day) === choice.anchor_cycle_day
}

/** An active cycle for this exact pattern and anchor, or the id created on this page. */
export function reusableSetupCycleId(
  cycles: unknown,
  choice: SetupCycleChoice,
  createdCycleId: string | null,
): string | null {
  if (createdCycleId) return createdCycleId
  if (!Array.isArray(cycles)) return null
  for (const cycle of cycles) {
    const record = cycleRecord(cycle)
    if (!record || record.is_active !== true) continue
    if (!samePattern(record.pattern, choice.pattern) || !sameAnchor(record, choice)) continue
    return typeof record.id === 'string' && record.id ? record.id : createdCycleId
  }
  return null
}

function createdId(value: unknown): string | null {
  const record = cycleRecord(value)
  const id = record?.id
  return typeof id === 'string' && id ? id : null
}

/**
 * Save the rotation first, then mark setup complete.
 * A retry reuses this session's cycle, or an active cycle that is already the chosen one.
 */
export async function saveOnboardingCycle(actions: {
  listCycles: () => Promise<unknown>
  createCycle: () => Promise<unknown>
  completeOnboarding: () => Promise<unknown>
  choice: SetupCycleChoice
  createdCycleId: string | null
  onCycleSaved?: (cycleId: string | null) => void
}): Promise<string | null> {
  let cycles: unknown
  try {
    cycles = await actions.listCycles()
  } catch {
    throw new Error(CYCLE_CHECK_ERROR)
  }
  const existing = reusableSetupCycleId(cycles, actions.choice, actions.createdCycleId)
  let cycleId = existing
  if (!existing) {
    try {
      cycleId = createdId(await actions.createCycle()) ?? actions.createdCycleId
    } catch {
      throw new Error(CYCLE_SAVE_ERROR)
    }
  }
  actions.onCycleSaved?.(cycleId)
  try {
    await actions.completeOnboarding()
  } catch {
    throw new Error(ONBOARDING_COMPLETE_ERROR)
  }
  return cycleId
}

function ruleRecord(value: unknown): Record<string, unknown> | null {
  return cycleRecord(value)
}

function ruleAlreadySaved(row: unknown, wanted: SetupRule): boolean {
  const record = ruleRecord(row)
  if (!record) return false
  if (record.name === wanted.name) return true
  const rule = ruleRecord(record.rule)
  if (!rule) return false
  return rule.type === wanted.rule.type && String(rule.value) === String(wanted.rule.value)
}

/** Rules from this form that are not already stored. */
export function rulesStillNeeded(selected: SetupRule[], existing: unknown): SetupRule[] {
  const rows = Array.isArray(existing) ? existing : []
  return selected.filter((wanted) => !rows.some((row) => ruleAlreadySaved(row, wanted)))
}

/** The account is already onboarded. A failed settings copy must not stop setup. */
export async function copyRulesIntoSettings(copy: () => Promise<unknown>): Promise<void> {
  try {
    await copy()
  } catch (error) {
    console.error('Failed to copy rules into settings:', error)
  }
}
