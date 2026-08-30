import { useAuth } from '../store/useAuth'

export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:4000/api'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  familyId: string
}

export interface AuthFamily {
  id: string
  name: string
  currency: string
}

/** Authenticated request with automatic token refresh on a single 401. */
async function raw(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<unknown> {
  const token = useAuth.getState().accessToken
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string> | undefined) ?? {}),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (res.status === 401 && retry && useAuth.getState().refreshToken) {
    const refreshed = await useAuth.getState().tryRefresh()
    if (refreshed) return raw(path, options, false)
    useAuth.getState().clear()
  }

  const text = await res.text()
  const body = text ? JSON.parse(text) : null
  if (!res.ok) {
    const message =
      (body as { error?: { message?: string } } | null)?.error?.message ??
      `Request failed (${res.status})`
    throw new Error(message)
  }
  return body
}

export const api = {
  get: (p: string) => raw(p, { method: 'GET' }),
  post: (p: string, b?: unknown) =>
    raw(p, { method: 'POST', body: b ? JSON.stringify(b) : undefined }),
  put: (p: string, b?: unknown) =>
    raw(p, { method: 'PUT', body: b ? JSON.stringify(b) : undefined }),
  patch: (p: string, b?: unknown) =>
    raw(p, { method: 'PATCH', body: b ? JSON.stringify(b) : undefined }),
  del: (p: string) => raw(p, { method: 'DELETE' }),
}

/** Unauthenticated auth endpoints. */
async function authPost(path: string, body: unknown): Promise<any> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  const json = text ? JSON.parse(text) : null
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Request failed (${res.status})`)
  }
  return json
}

export const authApi = {
  login: (email: string, password: string) =>
    authPost('/auth/login', { email, password }).then((r) => r.data),
  register: (
    familyName: string,
    name: string,
    email: string,
    password: string,
  ) =>
    authPost('/auth/register', { familyName, name, email, password }).then(
      (r) => r.data,
    ),
  refresh: (refreshToken: string) =>
    authPost('/auth/refresh', { refreshToken }).then((r) => r.data),
  logout: (refreshToken: string) =>
    authPost('/auth/logout', { refreshToken }).catch(() => undefined),
}
