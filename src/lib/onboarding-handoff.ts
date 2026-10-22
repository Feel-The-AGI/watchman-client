/** The last onboarding button must not move. A sliding animation drops the click. */
export function dashboardHandoffButton(): {
  label: string
  initial: false
  animate: false
  pointerEvents: 'auto'
} {
  return {
    label: 'Go to Dashboard',
    initial: false,
    animate: false,
    pointerEvents: 'auto',
  }
}
