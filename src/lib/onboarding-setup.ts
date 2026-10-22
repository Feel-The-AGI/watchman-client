export const CYCLE_CHECK_ERROR = 'Could not check whether your rotation was already saved. Nothing was marked complete. Try again.'

export const CYCLE_SAVE_ERROR = 'Your rotation could not be saved, so setup was not marked complete. Your choices are still here. Try again.'

export const ONBOARDING_COMPLETE_ERROR = 'Your rotation is saved, but setup could not be marked complete. Try again. Another rotation will not be created.'

/** A cycle from this setup attempt. Onboarding does not create a second one. */
export function hasSavedCycle(cycles: unknown): boolean {
  return Array.isArray(cycles) && cycles.length > 0
}

/**
 * Save the rotation first, then mark setup complete.
 * A later retry that finds the cycle only finishes the flag.
 */
export async function saveOnboardingCycle(actions: {
  listCycles: () => Promise<unknown>
  createCycle: () => Promise<unknown>
  completeOnboarding: () => Promise<unknown>
}): Promise<void> {
  let cycles: unknown
  try {
    cycles = await actions.listCycles()
  } catch {
    throw new Error(CYCLE_CHECK_ERROR)
  }
  if (!hasSavedCycle(cycles)) {
    try {
      await actions.createCycle()
    } catch {
      throw new Error(CYCLE_SAVE_ERROR)
    }
  }
  try {
    await actions.completeOnboarding()
  } catch {
    throw new Error(ONBOARDING_COMPLETE_ERROR)
  }
}
