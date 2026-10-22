import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  CYCLE_SAVE_ERROR,
  copyRulesIntoSettings,
  ONBOARDING_COMPLETE_ERROR,
  createdCycleIdAfterChoiceChange,
  reusableSetupCycleId,
  rulesStillNeeded,
  saveOnboardingCycle,
  type SetupCycleChoice,
  type SetupRule,
} from './onboarding-setup.ts'

const choice: SetupCycleChoice = {
  pattern: [
    { label: 'work_day', duration: 5 },
    { label: 'work_night', duration: 5 },
    { label: 'off', duration: 5 },
  ],
  anchor_date: '2026-10-22',
  anchor_cycle_day: 1,
}

const activeMatch = {
  id: 'cycle-active',
  is_active: true,
  pattern: choice.pattern,
  anchor_date: '2026-10-22',
  anchor_cycle_day: 1,
}

describe('which cycle already belongs to this setup', () => {
  it('creates a new cycle when the only saved one is inactive or a different rotation', () => {
    const inactive = { ...activeMatch, id: 'old', is_active: false }
    const otherAnchor = { ...activeMatch, id: 'other', anchor_date: '2026-01-01' }
    assert.equal(reusableSetupCycleId([inactive, otherAnchor], choice, null), null)
    assert.equal(reusableSetupCycleId([activeMatch], choice, null), 'cycle-active')
    assert.equal(reusableSetupCycleId([inactive], choice, 'cycle-this-session'), 'cycle-this-session')
  })
})

describe('retry after the pattern or anchor changes', () => {
  it('drops the saved cycle id so the next finish creates a new rotation', () => {
    assert.equal(createdCycleIdAfterChoiceChange('cycle-1', choice, choice), 'cycle-1')
    assert.equal(
      createdCycleIdAfterChoiceChange('cycle-1', choice, { ...choice, anchor_date: '2026-11-01' }),
      null,
    )
    assert.equal(
      createdCycleIdAfterChoiceChange('cycle-1', choice, { ...choice, anchor_cycle_day: 2 }),
      null,
    )
    assert.equal(
      createdCycleIdAfterChoiceChange('cycle-1', choice, {
        ...choice,
        pattern: [{ label: 'work_day', duration: 14 }, { label: 'off', duration: 14 }],
      }),
      null,
    )
  })
})

describe('save onboarding cycle', () => {
  const base = {
    choice,
    createdCycleId: null as string | null,
  }

  it('does not mark setup complete when the rotation fails to save', async () => {
    const calls: string[] = []
    await assert.rejects(
      () => saveOnboardingCycle({
        ...base,
        listCycles: async () => {
          calls.push('list')
          return []
        },
        createCycle: async () => {
          calls.push('create')
          throw new Error('database down')
        },
        completeOnboarding: async () => {
          calls.push('complete')
        },
      }),
      (error: unknown) => error instanceof Error && error.message === CYCLE_SAVE_ERROR,
    )
    assert.deepEqual(calls, ['list', 'create'])
  })

  it('reuses the active matching cycle and still creates when the choice is new', async () => {
    const calls: string[] = []
    await saveOnboardingCycle({
      ...base,
      listCycles: async () => {
        calls.push('list')
        return [activeMatch, { id: 'old', is_active: false, pattern: choice.pattern }]
      },
      createCycle: async () => {
        calls.push('create')
        return { id: 'should-not' }
      },
      completeOnboarding: async () => {
        calls.push('complete')
      },
    })
    assert.deepEqual(calls, ['list', 'complete'])

    calls.length = 0
    await saveOnboardingCycle({
      ...base,
      choice: { ...choice, anchor_date: '2026-11-01' },
      listCycles: async () => [activeMatch],
      createCycle: async () => {
        calls.push('create')
        return { id: 'cycle-new' }
      },
      completeOnboarding: async () => {
        calls.push('complete')
      },
    })
    assert.deepEqual(calls, ['create', 'complete'])
  })

  it('saves the rotation and then marks setup complete', async () => {
    const calls: string[] = []
    const id = await saveOnboardingCycle({
      ...base,
      listCycles: async () => [],
      createCycle: async () => {
        calls.push('create')
        return { id: 'cycle-new' }
      },
      completeOnboarding: async () => {
        calls.push('complete')
      },
    })
    assert.equal(id, 'cycle-new')
    assert.deepEqual(calls, ['create', 'complete'])
  })

  it('can be retried after the rotation saved and the flag did not', async () => {
    const calls: string[] = []
    let created = false
    const run = (createdCycleId: string | null, onCycleSaved?: (id: string | null) => void) => saveOnboardingCycle({
      choice,
      createdCycleId,
      onCycleSaved,
      listCycles: async () => (created ? [{ id: 'cycle-1', is_active: false }] : []),
      createCycle: async () => {
        calls.push('create')
        created = true
        return { id: 'cycle-1' }
      },
      completeOnboarding: async () => {
        calls.push('complete')
        if (calls.filter((call) => call === 'complete').length === 1) throw new Error('network')
      },
    })
    let savedId: string | null = null
    await assert.rejects(
      () => run(null, (id) => {
        savedId = id
      }),
      (error: unknown) => error instanceof Error && error.message === ONBOARDING_COMPLETE_ERROR,
    )
    await run(savedId)
    assert.deepEqual(calls, ['create', 'complete', 'complete'])
  })
})

describe('onboarding rules', () => {
  const night: SetupRule = { name: 'No study on night shifts', rule: { type: 'no_study_on', value: 'work_night' } }
  const cap: SetupRule = { name: 'Max 2 commitments per day', rule: { type: 'max_concurrent_commitments', value: 2 } }

  it('skips a rule that is already stored', () => {
    const needed = rulesStillNeeded([night, cap], [
      { name: 'No study on night shifts', rule: { type: 'no_study_on', value: 'work_night' } },
    ])
    assert.deepEqual(needed, [cap])
  })

  it('still finishes setup when copying rules into settings fails', async () => {
    const errors: unknown[] = []
    const original = console.error
    console.error = (...args: unknown[]) => {
      errors.push(args[1])
    }
    try {
      await copyRulesIntoSettings(async () => {
        throw new Error('settings write failed')
      })
    } finally {
      console.error = original
    }
    assert.equal(errors[0] instanceof Error && (errors[0] as Error).message, 'settings write failed')
  })
})
