import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { AdvancedModeToggle } from '@/components/AdvancedModeToggle'
import { AvailableMaterialsField } from '@/components/AvailableMaterialsField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { improveSavedSheet, improveSheet } from '@/lib/api'
import {
  DocumentExtractionError,
  extractDocuments,
  extractDocumentText,
} from '@/lib/documentExtractors'
import { translateCurrent, useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { GenerationMode, SavedSheet, SavedSheetSaveMode } from '@/types/preparation'

type ImproveSheetFormProps = {
  savedSheetId?: string
  savedSheetTitle?: string
  onResult: (saved: SavedSheet) => void
  onError: (message: string) => void
}

export function ImproveSheetForm({
  savedSheetId,
  savedSheetTitle,
  onResult,
  onError,
}: ImproveSheetFormProps) {
  const { t } = useI18n()
  const [sheetFile, setSheetFile] = useState<File | null>(null)
  const [resourceFiles, setResourceFiles] = useState<FileList | null>(null)
  const [notes, setNotes] = useState('')
  const [availableMaterials, setAvailableMaterials] = useState('')
  const [advancedMode, setAdvancedMode] = useState(false)
  const [saveMode, setSaveMode] = useState<SavedSheetSaveMode>('replace')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onError('')

    if (!savedSheetId && !sheetFile) {
      return onError(t('improve.formMissingSheet'))
    }

    try {
      setSubmitting(true)
      const resources = resourceFiles ? await extractDocuments(resourceFiles) : []
      const generationMode: GenerationMode = advancedMode ? 'advanced' : 'fast'
      const payload = {
        resources,
        notes: notes.trim() || undefined,
        availableMaterials: availableMaterials.trim() || undefined,
        saveMode: savedSheetId ? saveMode : undefined,
        generationMode,
      }
      const result = savedSheetId
        ? await improveSavedSheet(savedSheetId, payload)
        : await improveSheet({
            ...payload,
            existingSheet: await extractDocumentText(sheetFile as File),
          })
      onResult(result)
    } catch (error) {
      onError(readError(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {savedSheetId ? (
        <div className="space-y-4 rounded-lg border bg-primary/5 px-4 py-3">
          <div>
            <p className="text-sm font-medium">{t('improve.savedSelected')}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {savedSheetTitle ?? t('improve.savedFallback')}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('improve.saveModeTitle')}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <SaveModeButton
                active={saveMode === 'replace'}
                title={t('improve.saveModeReplace')}
                description={t('improve.saveModeReplaceDescription')}
                onClick={() => setSaveMode('replace')}
              />
              <SaveModeButton
                active={saveMode === 'copy'}
                title={t('improve.saveModeCopy')}
                description={t('improve.saveModeCopyDescription')}
                onClick={() => setSaveMode('copy')}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="existing-sheet">{t('improve.sheetInputLabel')}</Label>
          <Input
            id="existing-sheet"
            type="file"
            required
            accept=".pdf,.docx,.odt,.txt,application/pdf,text/plain"
            onChange={(event) => setSheetFile(event.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted-foreground">{t('improve.sheetInputHelp')}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="improve-resources">{t('improve.resources')}</Label>
        <Input
          id="improve-resources"
          type="file"
          multiple
          accept=".pdf,.docx,.odt,.txt,application/pdf,text/plain"
          onChange={(event) => setResourceFiles(event.target.files)}
        />
      </div>

      <AvailableMaterialsField
        id="improve-available-materials"
        value={availableMaterials}
        onChange={setAvailableMaterials}
      />

      <div className="space-y-2">
        <Label htmlFor="improve-notes">{t('improve.notes')}</Label>
        <Textarea
          id="improve-notes"
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={t('improve.notesPlaceholder')}
        />
      </div>

      <AdvancedModeToggle checked={advancedMode} onCheckedChange={setAdvancedMode} />

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        {submitting ? t('improve.submitting') : t('improve.submit')}
      </Button>
    </form>
  )
}

function SaveModeButton({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        'rounded-lg border bg-background px-3 py-2 text-left transition-colors',
        active ? 'border-primary bg-primary/10' : 'hover:bg-accent/40',
      )}
      onClick={onClick}
    >
      <span className="block text-sm font-medium">{title}</span>
      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
        {description}
      </span>
    </button>
  )
}

function readError(error: unknown): string {
  if (error instanceof DocumentExtractionError || error instanceof Error) {
    return error.message
  }
  return translateCurrent('global.unexpectedError')
}
