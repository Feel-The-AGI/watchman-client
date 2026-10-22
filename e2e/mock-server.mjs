import { createServer } from 'node:http'

const EMAIL = 'jasonquist.ia+e2e3@gmail.com'
const HORIZON = '2027-01-22'

function pad(value) {
  return String(value).padStart(2, '0')
}

function iso(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function workFor(year, month, day) {
  const utc = Date.UTC(year, month - 1, day)
  const anchor = Date.UTC(2026, 9, 22)
  const diff = Math.round((utc - anchor) / 86400000)
  const cycle = ((diff % 8) + 8) % 8
  return {
    work_type: cycle < 4 ? 'work_day' : 'off',
    cycle_day: cycle + 1,
    block_day: cycle < 4 ? cycle + 1 : cycle - 3,
  }
}

function yearDays(year) {
  const days = []
  for (let month = 1; month <= 12; month += 1) {
    const count = daysInMonth(year, month)
    for (let day = 1; day <= count; day += 1) {
      const date = iso(year, month, day)
      const shift = workFor(year, month, day)
      days.push({
        date,
        work_type: shift.work_type,
        cycle_day: shift.cycle_day,
        block_day: shift.block_day,
        is_leave: false,
        commitments: [],
        state_json: { engine_version: 1 },
      })
    }
  }
  return days
}

function monthlyBreakdown(year) {
  return Array.from({ length: 12 }, (_, index) => ({
    month: `${year}-${pad(index + 1)}`,
    work_days: 10 + index,
    work_nights: index % 2,
    off_days: 8,
    leave_days: 0,
    study_hours: index + 1,
  }))
}

const profile = {
  id: 'user-1',
  email: EMAIL,
  name: EMAIL.split('@')[0],
  timezone: 'UTC',
  tier: 'free',
  role: 'user',
  onboarding_completed: true,
  settings: {},
}

const cycle = {
  id: 'cycle-1',
  name: '4 on / 4 off',
  is_active: true,
  pattern: [
    { label: 'work_day', duration: 4 },
    { label: 'off', duration: 4 },
  ],
  anchor_date: '2026-10-22',
  anchor_cycle_day: 1,
  total_days: 8,
}

const masterSettings = {
  version: 1,
  settings: {
    cycle: {
      pattern: cycle.pattern,
      anchor_date: cycle.anchor_date,
      anchor_cycle_day: 1,
    },
    work: {
      day_hours: { start: '06:00', end: '18:00' },
      night_hours: { start: '18:00', end: '06:00' },
      available_hours_on_off: 12,
      available_hours_on_work: 2,
    },
    constraints: [],
    commitments: [],
    leave_blocks: [],
  },
}

function detailedStats(year) {
  return {
    year: Number(year),
    total_days: 365,
    total_work_days: 180,
    total_work_nights: 0,
    total_off_days: 180,
    total_leave_days: 0,
    total_study_hours: 78,
    commitment_count: 0,
    monthly_breakdown: monthlyBreakdown(Number(year)),
    peak_weeks: [{ week_start: `${year}-01-05`, week_end: `${year}-01-11`, total_hours: 4, is_overloaded: false }],
    commitment_breakdown: [],
  }
}

function send(res, status, body) {
  const origin = res.req.headers.origin || '*'
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': origin,
    'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info, x-supabase-api-version',
    'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'access-control-allow-credentials': 'true',
    vary: 'origin',
  })
  res.end(payload)
}

const user = {
  id: 'user-1',
  aud: 'authenticated',
  role: 'authenticated',
  email: EMAIL,
  email_confirmed_at: '2026-10-01T00:00:00.000Z',
  confirmed_at: '2026-10-01T00:00:00.000Z',
  last_sign_in_at: '2026-10-22T12:00:00.000Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { name: EMAIL.split('@')[0] },
  identities: [],
  created_at: '2026-10-01T00:00:00.000Z',
  updated_at: '2026-10-22T12:00:00.000Z',
}

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1')
  if (req.method === 'OPTIONS') {
    send(res, 204, {})
    return
  }

  if (url.pathname === '/auth/v1/user') {
    send(res, 200, user)
    return
  }

  if (url.pathname.startsWith('/auth/v1/token')) {
    send(res, 200, {
      access_token: 'header.payload.sig',
      refresh_token: 'refresh',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user,
    })
    return
  }

  if (url.pathname === '/api/auth/me') {
    send(res, 200, profile)
    return
  }

  if (url.pathname === '/api/cycles') {
    send(res, 200, { success: true, data: [cycle] })
    return
  }

  const yearMatch = url.pathname.match(/^\/api\/calendar\/year\/(\d+)$/)
  if (yearMatch) {
    send(res, 200, {
      success: true,
      data: yearDays(Number(yearMatch[1])),
      free_horizon_end: HORIZON,
    })
    return
  }

  if (url.pathname === '/api/stats/summary') {
    const year = Number(url.searchParams.get('year') || 2026)
    send(res, 200, {
      success: true,
      data: {
        year,
        total_days: 365,
        work_days: 180,
        work_nights: 0,
        off_days: 180,
        leave_days: 0,
        study_hours: 78,
        commitment_count: 0,
      },
    })
    return
  }

  const statsYear = url.pathname.match(/^\/api\/stats\/year\/(\d+)$/)
  if (statsYear) {
    send(res, 200, { success: true, data: detailedStats(statsYear[1]) })
    return
  }

  if (url.pathname === '/api/master-settings') {
    send(res, 200, { success: true, data: masterSettings })
    return
  }

  if (url.pathname === '/api/settings') {
    send(res, 200, {
      success: true,
      data: {
        settings: {},
        tier: 'free',
        effective_tier: 'free',
        role: 'user',
        trial: null,
      },
    })
    return
  }

  if (url.pathname === '/api/settings/subscription') {
    send(res, 200, { success: true, data: { tier: 'free', subscription: { status: 'active' } } })
    return
  }

  if (url.pathname === '/api/payments/subscription-status') {
    send(res, 200, { success: true, data: { tier: 'free', active: false, current_period_end: null } })
    return
  }

  if (url.pathname === '/api/payments/pricing') {
    send(res, 200, {
      success: true,
      data: {
        usd_price: 12,
        ghs_amount: 186.4,
        exchange_rate: 15.53,
        currency: 'GHS',
        display_price: '$12',
        display_ghs: 'GHS 186.40',
        note: '',
      },
    })
    return
  }

  if (url.pathname === '/api/chat/history') {
    send(res, 200, { success: true, data: { messages: [], history_limit: 50 } })
    return
  }

  if (url.pathname === '/api/commands/proposals/pending') {
    send(res, 200, { success: true, data: { proposals: [] } })
    return
  }

  if (url.pathname === '/api/incidents/stats') {
    send(res, 200, { success: true, data: { total_count: 0, by_type: {}, by_severity: {}, by_month: {} } })
    return
  }

  if (url.pathname.startsWith('/api/stats/export') || url.pathname.includes('/export')) {
    send(res, 403, { detail: 'This feature is part of the Pro plan. Upgrade to unlock intelligent parsing and full statistics.' })
    return
  }

  console.log('mock fallback', req.method, url.pathname)
  send(res, 200, { success: true, data: [] })
})

server.listen(4010, '127.0.0.1', () => {
  console.log('mock watchman api on http://127.0.0.1:4010')
})
