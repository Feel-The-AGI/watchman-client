import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  CYCLE_SAVE_ERROR,
  hasSavedCycle,
  ONBOARDING_COMPLETE_ERROR,
  saveOnboardingCycle,
} from './onboarding-setup.ts'

describe('save onboarding cycle', () => {
  it('does not mark setup complete when the rotation fails to save', async () => {
    const calls: string[] = []
    await assert.rejects(
      () => saveOnboardingCycle({
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

  it('marks setup complete without creating a second rotation', async () => {
    const calls: string[] = []
    await saveOnboardingCycle({
      listCycles: async () => {
        calls.push('list')
        return [{ id: 'cycle-1', name: 'My Rotation' }]
      },
      createCycle: async () => {
        calls.push('create')
      },
      completeOnboarding: async () => {
        calls.push('complete')
      },
    })
    assert.equal(hasSavedCycle([{ id: 'cycle-1' }]), true)
    assert.deepEqual(calls, ['list', 'complete'])
  })

  it('saves the rotation and then marks setup complete', async () => {
    const calls: string[] = []
    await saveOnboardingCycle({
      listCycles: async () => {
        calls.push('list')
        return []
      },
      createCycle: async () => {
        calls.push('create')
      },
      completeOnboarding: async () => {
        calls.push('complete')
      },
    })
    assert.deepEqual(calls, ['list', 'create', 'complete'])
  })

  it('can be retried after the rotation saved and the flag did not', async () => {
    const calls: string[] = []
    let saved = false
    const actions = {
      listCycles: async () => (saved ? [{ id: 'cycle-1' }] : []),
      createCycle: async () => {
        calls.push('create')
        saved = true
      },
      completeOnboarding: async () => {
        calls.push('complete')
        if (calls.filter((call) => call === 'complete').length === 1) throw new Error('network')
      },
    }
    await assert.rejects(() => saveOnboardingCycle(actions), (error: unknown) => (
      error instanceof Error && error.message === ONBOARDING_COMPLETE_ERROR
    ))
    await saveOnboardingCycle(actions)
    assert.deepEqual(calls, ['create', 'complete', 'complete'])
  })
})
