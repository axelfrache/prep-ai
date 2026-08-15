import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { AdvancedModeToggle } from '@/components/AdvancedModeToggle'
import { AvailableMaterialsField } from '@/components/AvailableMaterialsField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createSheet } from '@/lib/api'
import { DocumentExtractionError, extractDocuments } from '@/lib/documentExtractors'
import { translateCurrent, useI18n } from '@/lib/i18n'
import type { SavedSheet } from '@/types/preparation'

type CreateSheetFormProps = {
  onResult: (saved: SavedSheet) => void
  onError: (message: string) => void
}

const levelOptions = ['CE2']

export function CreateSheetForm({ onResult, onError }: CreateSheetFormProps) {
  const { t } = useI18n()
  const [subject, setSubject] = useState('')
  const [level, setLevel] = useState('CE2')
  const [duration, setDuration] = useState('45')
  const [period, setPeriod] = useState('')
  const [notes, setNotes] = useState('')
  const [availableMaterials, setAvailableMaterials] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [advancedMode, setAdvancedMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onError('')

    const durationMinutes = Number(duration)
    if (!subject.trim()) return onError(t('create.subjectError'))
    if (!level.trim()) return onError(t('create.levelError'))
    if (!Number.isInteger(durationMinutes) || durationMinutes < 10 || durationMinutes > 180) {
      return onError(t('create.durationError'))
    }

    try {
      setSubmitting(true)
      const resources = files ? await extractDocuments(files) : []
      const result = await createSheet({
        subject: subject.trim(),
        level: level.trim(),
        durationMinutes,
        resources,
        notes: notes.trim() || undefined,
        availableMaterials: availableMaterials.trim() || undefined,
        period: period.trim() || undefined,
        generationMode: advancedMode ? 'advanced' : 'fast',
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
      <div className="space-y-2">
        <Label htmlFor="subject">{t('create.subject')}</Label>
        <Input
          id="subject"
          required
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder={t('create.subjectPlaceholder')}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="level">{t('create.level')}</Label>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger id="level" className="w-full">
              <SelectValue placeholder={t('create.level')} />
            </SelectTrigger>
            <SelectContent>
              {levelOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration">{t('create.duration')}</Label>
          <Input
            id="duration"
            type="number"
            min={10}
            max={180}
            required
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="resources">{t('create.resources')}</Label>
        <Input
          id="resources"
          type="file"
          multiple
          accept=".pdf,.docx,.odt,.txt,application/pdf,text/plain"
          onChange={(event) => setFiles(event.target.files)}
        />
        <p className="text-xs text-muted-foreground">{t('create.resourcesHelp')}</p>
      </div>

      <AvailableMaterialsField
        id="create-available-materials"
        value={availableMaterials}
        onChange={setAvailableMaterials}
      />

      <details className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium">{t('create.details')}</summary>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-notes">{t('create.notes')}</Label>
            <Textarea
              id="create-notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={t('create.notesPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="period">{t('create.period')}</Label>
            <Input
              id="period"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              placeholder={t('global.optional')}
            />
          </div>
        </div>
      </details>

      <AdvancedModeToggle checked={advancedMode} onCheckedChange={setAdvancedMode} />

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        {submitting ? t('create.submitting') : t('create.submit')}
      </Button>
    </form>
  )
}

function readError(error: unknown): string {
  if (error instanceof DocumentExtractionError || error instanceof Error) {
    return error.message
  }
  return translateCurrent('global.unexpectedError')
}
