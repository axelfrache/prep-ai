import { useState } from 'react'
import { Loader2 } from 'lucide-react'
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
import type { PreparationResult } from '@/types/preparation'

type CreateSheetFormProps = {
  onResult: (result: PreparationResult) => void
  onError: (message: string) => void
}

const levelOptions = ['CE2']

export function CreateSheetForm({ onResult, onError }: CreateSheetFormProps) {
  const [subject, setSubject] = useState('')
  const [level, setLevel] = useState('CE2')
  const [duration, setDuration] = useState('45')
  const [period, setPeriod] = useState('')
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onError('')

    const durationMinutes = Number(duration)
    if (!subject.trim()) return onError('La matière ou notion est obligatoire.')
    if (!level.trim()) return onError('Le niveau est obligatoire.')
    if (!Number.isInteger(durationMinutes) || durationMinutes < 10 || durationMinutes > 180) {
      return onError('La durée doit être comprise entre 10 et 180 minutes.')
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
        period: period.trim() || undefined,
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
        <Label htmlFor="subject">Matière / notion</Label>
        <Input
          id="subject"
          required
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="Ex. Mathématiques - poser une addition"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="level">Niveau</Label>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger id="level" className="w-full">
              <SelectValue placeholder="Niveau" />
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
          <Label htmlFor="duration">Durée (min)</Label>
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
        <Label htmlFor="resources">Ressources</Label>
        <Input
          id="resources"
          type="file"
          multiple
          accept=".pdf,.docx,.odt,.txt,application/pdf,text/plain"
          onChange={(event) => setFiles(event.target.files)}
        />
        <p className="text-xs text-muted-foreground">
          PDF, DOCX, ODT ou TXT. Le texte est extrait dans votre navigateur.
        </p>
      </div>

      <details className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium">Ajouter une précision</summary>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-notes">Remarques ou contraintes</Label>
            <Textarea
              id="create-notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ex. séance de découverte, manuel à utiliser, point à éviter..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="period">Période</Label>
            <Input
              id="period"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              placeholder="Optionnel"
            />
          </div>
        </div>
      </details>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        {submitting ? 'Préparation de votre fiche...' : 'Générer ma fiche'}
      </Button>
    </form>
  )
}

function readError(error: unknown): string {
  if (error instanceof DocumentExtractionError || error instanceof Error) {
    return error.message
  }
  return 'Une erreur inattendue est survenue.'
}
