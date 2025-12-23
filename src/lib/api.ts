/**
 * Watchman API Service
 * Centralized API communication layer
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://watchman-api-dnm0.onrender.com'

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'APIError'
  }
}

class APIService {
  private baseUrl: string
  private token: string | null = null

  constructor() {
    this.baseUrl = API_URL
  }

  setToken(token: string | null) {
    this.token = token
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new APIError(response.status, data.detail || data.message || 'An error occurred')
    }

    // Handle blob responses for exports
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/octet-stream') || 
        contentType?.includes('text/csv') ||
        contentType?.includes('application/pdf')) {
      return response.blob() as Promise<T>
    }

    const json = await response.json()
    
    // Unwrap { success: true, data: ... } responses from backend
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return json.data as T
    }
    
    return json as T
  }

  // Organized API endpoints by resource
  cycles = {
    list: () => this.request<any[]>('/api/cycles'),
    get: (id: string) => this.request<any>(`/api/cycles/${id}`),
    getActive: () => this.request<any>('/api/cycles/active'),
    create: (data: any) => this.request<any>('/api/cycles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => this.request<any>(`/api/cycles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => this.request<void>(`/api/cycles/${id}`, {
      method: 'DELETE',
    }),
  }

  commitments = {
    list: (status?: string) => {
      const query = status ? `?status=${status}` : ''
      return this.request<any[]>(`/api/commitments${query}`)
    },
    get: (id: string) => this.request<any>(`/api/commitments/${id}`),
    getActive: () => this.request<any[]>('/api/commitments/active'),
    create: (data: any) => this.request<any>('/api/commitments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => this.request<any>(`/api/commitments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => this.request<void>(`/api/commitments/${id}`, {
      method: 'DELETE',
    }),
  }

  calendar = {
    getDays: (startDate: string, endDate: string) =>
      this.request<any>(`/api/calendar?start_date=${startDate}&end_date=${endDate}`),
    getYear: (year: number) => this.request<any>(`/api/calendar/year/${year}`),
    getMonth: (year: number, month: number) =>
      this.request<any>(`/api/calendar/month/${year}/${month}`),
    getDay: (date: string) => this.request<any>(`/api/calendar/day/${date}`),
    regenerate: (year: number) => this.request<any>('/api/calendar/generate', {
      method: 'POST',
      body: JSON.stringify({ year, regenerate: true }),
    }),
    addLeave: (data: any) => this.request<any>('/api/calendar/leave', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getLeave: () => this.request<any[]>('/api/calendar/leave'),
    deleteLeave: (id: string) => this.request<void>(`/api/calendar/leave/${id}`, {
      method: 'DELETE',
    }),
  }

  stats = {
    getSummary: (year?: number) => {
      const query = year ? `?year=${year}` : ''
      return this.request<any>(`/api/stats/summary${query}`)
    },
    getDetailed: (year: number) => this.request<any>(`/api/stats/year/${year}`),
    getMonthly: (year: number, month: number) =>
      this.request<any>(`/api/stats/month/${year}/${month}`),
    getCommitments: () => this.request<any>('/api/stats/commitments'),
    getDashboard: () => this.request<any>('/api/stats/dashboard'),
    export: (year: number, format: 'csv' | 'pdf') =>
      this.request<Blob>(`/api/stats/export?year=${year}&format=${format}`),
  }

  settings = {
    get: () => this.request<any>('/api/settings'),
    update: (data: any) => this.request<any>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    updateProfile: (data: any) => this.request<any>('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    getConstraints: () => this.request<any[]>('/api/settings/constraints'),
    createConstraint: (data: any) => this.request<any>('/api/settings/constraints', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateConstraint: (id: string, data: any) =>
      this.request<any>(`/api/settings/constraints/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    deleteConstraint: (id: string) =>
      this.request<void>(`/api/settings/constraints/${id}`, {
        method: 'DELETE',
      }),
    getSubscription: () => this.request<any>('/api/settings/subscription'),
    getPortalUrl: () => this.request<{ url: string }>('/api/settings/billing-portal'),
    deleteAccount: () => this.request<void>('/api/settings/delete-account', {
      method: 'DELETE',
    }),
  }

  auth = {
    getProfile: () => this.request<any>('/api/auth/me'),
    completeOnboarding: () => this.request<any>('/api/auth/complete-onboarding', {
      method: 'POST',
    }),
  }

  // New overhaul endpoints
  chat = {
    sendMessage: (content: string, autoExecute: boolean = false) =>
      this.request<any>('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({ content, auto_execute: autoExecute }),
      }),
    getHistory: (limit: number = 50) =>
      this.request<any>(`/api/chat/history?limit=${limit}`),
    clearHistory: () =>
      this.request<any>('/api/chat/history', {
        method: 'DELETE',
      }),
  }

  commands = {
    list: (limit: number = 50, status?: string) => {
      let query = `?limit=${limit}`
      if (status) query += `&status=${status}`
      return this.request<any>(`/api/commands${query}`)
    },
    get: (id: string) => this.request<any>(`/api/commands/${id}`),
    undo: (commandId?: string) =>
      this.request<any>('/api/commands/undo', {
        method: 'POST',
        body: JSON.stringify({ command_id: commandId }),
      }),
    redo: (commandId?: string) =>
      this.request<any>('/api/commands/redo', {
        method: 'POST',
        body: JSON.stringify({ command_id: commandId }),
      }),
  }

  masterSettings = {
    get: () => this.request<any>('/api/master-settings'),
    update: (settings: any, expectedVersion?: number) =>
      this.request<any>('/api/master-settings', {
        method: 'PUT',
        body: JSON.stringify({ settings, expected_version: expectedVersion }),
      }),
    updateSection: (section: string, value: any) =>
      this.request<any>(`/api/master-settings/${section}`, {
        method: 'PATCH',
        body: JSON.stringify({ value }),
      }),
    getSnapshot: () => this.request<any>('/api/master-settings/snapshot'),
  }
}

export const api = new APIService()
export default api
