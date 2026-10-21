/** Comparison rows stay readable if a scroll animation never runs. */
export function pricingRowMotion(reduceMotion: boolean | null): {
  initial: false | { opacity: number; y: number }
  whileInView?: { opacity: number; y: number }
  viewport?: { once: true }
  transition?: { delay: number }
} {
  if (reduceMotion) return { initial: false }
  return {
    initial: { opacity: 1, y: 8 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
  }
}
