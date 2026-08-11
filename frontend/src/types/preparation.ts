export type BlockType =
  | 'instruction'
  | 'teacher_speech'
  | 'expected_answer'
  | 'teacher_relaunch'
  | 'anticipated_error'
  | 'support'
  | 'extension'

export type PreparationBlock = {
  type: BlockType
  text: string
}

export type PreparationPhase = {
  name: string
  durationMinutes: number
  organization: string
  blocks: PreparationBlock[]
}

export type PreparationSheet = {
  title: string
  subject: string
  level: string
  durationMinutes: number
  competencies: string[]
  objective: string
  materials: string[]
  phases: PreparationPhase[]
}

export type PreparationResult = {
  sheet: PreparationSheet
}

export type ExtractedDocument = {
  name: string
  type: string
  text: string
}

export type CreateSheetPayload = {
  subject: string
  level: string
  durationMinutes: number
  resources: ExtractedDocument[]
  notes?: string
  period?: string
}

export type ImproveSheetPayload = {
  existingSheet: ExtractedDocument
  resources: ExtractedDocument[]
  notes?: string
}
