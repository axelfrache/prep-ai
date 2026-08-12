import type {
  AuthResponse,
  CreateSheetPayload,
  ImproveSavedSheetPayload,
  ImproveSheetPayload,
  SavedSheet,
  SheetSummary,
} from '@/types/preparation'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''
const TOKEN_KEY = 'prepai.token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(
      'Impossible de joindre le service. Vérifiez votre connexion puis réessayez.',
      0,
    )
  }

  if (response.status === 401 && token) {
    clearToken()
    window.dispatchEvent(new Event('auth:logout'))
  }

  if (!response.ok) {
    throw new ApiError(await readableError(response), response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError('La réponse reçue est invalide.', response.status)
  }
}

export function register(email: string, password: string): Promise<AuthResponse> {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function createSheet(payload: CreateSheetPayload): Promise<SavedSheet> {
  return request('/api/create', { method: 'POST', body: JSON.stringify(payload) })
}

export function improveSheet(payload: ImproveSheetPayload): Promise<SavedSheet> {
  return request('/api/improve', { method: 'POST', body: JSON.stringify(payload) })
}

export function improveSavedSheet(
  id: string,
  payload: ImproveSavedSheetPayload,
): Promise<SavedSheet> {
  return request(`/api/sheets/${id}/improve`, { method: 'POST', body: JSON.stringify(payload) })
}

export function listSheets(): Promise<SheetSummary[]> {
  return request('/api/sheets')
}

export function getSheet(id: string): Promise<SavedSheet> {
  return request(`/api/sheets/${id}`)
}

export function deleteSheet(id: string): Promise<void> {
  return request(`/api/sheets/${id}`, { method: 'DELETE' })
}

async function readableError(response: Response): Promise<string> {
  const backendMessage = await readBackendError(response)
  if (backendMessage) {
    return backendMessage
  }
  if (response.status === 429) {
    return 'Le service est temporairement trop sollicité. Réessayez dans quelques instants.'
  }
  if (response.status >= 500) {
    return 'Le service rencontre une erreur temporaire. Réessayez plus tard.'
  }
  return "La demande n'a pas pu être traitée."
}

async function readBackendError(response: Response): Promise<string> {
  try {
    const payload = (await response.clone().json()) as { error?: string }
    return payload.error ?? ''
  } catch {
    return ''
  }
}
