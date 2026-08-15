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

export type SavedSheet = {
  id: string
  createdAt: string
  sheet: PreparationSheet
}

export type SheetSummary = {
  id: string
  title: string
  subject: string
  level: string
  durationMinutes: number
  createdAt: string
}

export type ExtractedDocument = {
  name: string
  type: string
  text: string
}

export type GenerationMode = 'fast' | 'advanced'
export type SavedSheetSaveMode = 'replace' | 'copy'

export type CreateSheetPayload = {
  subject: string
  level: string
  durationMinutes: number
  resources: ExtractedDocument[]
  notes?: string
  availableMaterials?: string
  adaptToClass?: boolean
  period?: string
  generationMode?: GenerationMode
}

export type ImproveSheetPayload = {
  existingSheet: ExtractedDocument
  resources: ExtractedDocument[]
  notes?: string
  availableMaterials?: string
  adaptToClass?: boolean
  generationMode?: GenerationMode
}

export type ImproveSavedSheetPayload = {
  resources: ExtractedDocument[]
  notes?: string
  availableMaterials?: string
  adaptToClass?: boolean
  generationMode?: GenerationMode
  saveMode?: SavedSheetSaveMode
}

export type UpdateSheetPayload = PreparationSheet

export type NeedGroup = {
  name: string
  needs: string
  adaptations: string
}

export type StudentProfile = {
  name: string
  strengths: string
  difficulties: string
  needs: string
  adaptations: string
}

export type ClassProfile = {
  level: string
  studentCount: number
  overallLevel: string
  classroomContext: string
  defaultMaterials: string
  avoidMaterials: string
  preferredSupports: string[]
  defaultSessionDuration: number
  pedagogicalPreferences: string[]
  needGroups: NeedGroup[]
  students: StudentProfile[]
  updatedAt?: string
}

export type AuthUser = {
  id: string
  email: string
}

export type AuthResponse = {
  token: string
  user: AuthUser
}

export type UpdateProfilePayload = {
  email: string
  password?: string
}
