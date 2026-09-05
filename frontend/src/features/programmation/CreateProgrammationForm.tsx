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
import { createProgrammation } from '@/lib/api'
import { DocumentExtractionError, extractDocuments } from '@/lib/documentExtractors'
import { translateCurrent, useI18n } from '@/lib/i18n'
import type { SavedProgrammation } from '@/types/preparation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageError } from '@/components/PageError'

type CreateProgrammationFormProps = {
  onSuccess: (result: SavedProgrammation) => void
}

const levelOptions = ['CE2']

export function CreateProgrammationForm({ onSuccess }: CreateProgrammationFormProps) {
  const { t } = useI18n()
  const [subject, setSubject] = useState('')
  const [level, setLevel] = useState('CE2')
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!subject.trim()) return setError('La matière ou domaine est obligatoire.')
    if (!level.trim()) return setError('Le niveau est obligatoire.')

    try {
      setSubmitting(true)
      const resources = files ? await extractDocuments(files) : []
      const result = await createProgrammation({
        subject: subject.trim(),
        level: level.trim(),
        resources,
        notes: notes.trim() || undefined,
      })
      onSuccess(result)
    } catch (err) {
      setError(readError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('programmation.title')}</CardTitle>
        <CardDescription>{t('programmation.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <PageError message={error} />
        <form className="space-y-5 mt-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="subject">Matière / domaine</Label>
            <Input
              id="subject"
              required
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Ex. Questionner le monde - Vivant"
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="resources">Ressources (Programmes ou progressions)</Label>
            <Input
              id="resources"
              type="file"
              multiple
              accept=".pdf,.docx,.odt,.txt,application/pdf,text/plain"
              onChange={(event) => setFiles(event.target.files)}
            />
          </div>

          <details className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
            <summary className="cursor-pointer font-medium">Ajouter une précision</summary>
            <div className="mt-4 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="create-notes">Remarques ou contraintes</Label>
                <Textarea
                  id="create-notes"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Ex. Insister sur la notion de cycle de vie..."
                />
              </div>
            </div>
          </details>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {submitting ? 'Génération...' : 'Générer ma programmation'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function readError(error: unknown): string {
  if (error instanceof DocumentExtractionError || error instanceof Error) {
    return error.message
  }
  return translateCurrent('global.unexpectedError')
}
