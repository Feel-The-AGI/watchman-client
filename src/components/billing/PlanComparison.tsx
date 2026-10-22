import { Check } from 'lucide-react'
import {
  PLAN_FREE_TICK,
  PLAN_PRO_TICK,
  READABLE_TEXT,
  planComparisonRows,
} from '@/lib/plan-catalog'

function IncludedMark({ included, column }: { included: boolean; column: 'free' | 'pro' }) {
  if (!included) {
    return (
      <span className="text-base leading-none" style={{ color: READABLE_TEXT }} aria-label="Not included">
        —
      </span>
    )
  }
  return (
    <Check
      className="mx-auto h-4 w-4"
      style={{ color: column === 'free' ? PLAN_FREE_TICK : PLAN_PRO_TICK }}
      aria-label="Included"
      data-testid={column === 'free' ? 'plan-free-tick' : 'plan-pro-tick'}
    />
  )
}

/** Feature rows shared by pricing and Settings. Values wrap inside the cell so 360px does not clip. */
export function PlanComparison() {
  const rows = planComparisonRows()
  return (
    <div data-testid="plan-comparison" className="min-w-0">
      <table className="w-full table-fixed text-left text-sm">
        <colgroup>
          <col className="w-[68%]" />
          <col className="w-[16%]" />
          <col className="w-[16%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-white/10">
            <th className="break-words px-2 py-3 font-medium sm:px-4" style={{ color: READABLE_TEXT }}>
              Feature
            </th>
            <th className="px-1 py-3 text-center font-medium sm:px-2" style={{ color: READABLE_TEXT }}>
              Free
            </th>
            <th className="px-1 py-3 text-center font-medium text-watchman-accent sm:px-2">
              Pro
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature} data-feature={row.feature} className="border-b border-white/5 last:border-0">
              <td className="break-words px-2 py-3 align-top text-zinc-100 sm:px-4">{row.feature}</td>
              <td
                className="px-1 py-3 text-center align-middle sm:px-2"
                data-column="free"
                data-included={row.free ? 'true' : 'false'}
              >
                <IncludedMark included={row.free} column="free" />
              </td>
              <td
                className="px-1 py-3 text-center align-middle sm:px-2"
                data-column="pro"
                data-included={row.pro ? 'true' : 'false'}
              >
                <IncludedMark included={row.pro} column="pro" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
