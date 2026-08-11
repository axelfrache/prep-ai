import type {
  CreateSheetPayload,
  ImproveSheetPayload,
  PreparationResult,
} from '@/types/preparation'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export function createSheet(payload: CreateSheetPayload): Promise<PreparationResult> {
  return postPreparation('/api/create', payload)
}

export function improveSheet(payload: ImproveSheetPayload): Promise<PreparationResult> {
  return postPreparation('/api/improve', payload)
}

async function postPreparation(path: string, payload: unknown): Promise<PreparationResult> {
  let response: Response

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('Impossible de joindre le service. Vérifiez votre connexion puis réessayez.')
  }

  if (!response.ok) {
    throw new Error(await readableError(response))
  }

  try {
    return (await response.json()) as PreparationResult
  } catch {
    throw new Error('La réponse reçue est invalide. Réessayez avec des ressources plus courtes.')
  }
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
    return 'Le service de génération rencontre une erreur temporaire. Réessayez plus tard.'
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
