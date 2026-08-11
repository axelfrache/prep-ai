import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { improveSheet } from '@/lib/api'
import { DocumentExtractionError, extractDocuments, extractDocumentText } from '@/lib/documentExtractors'
import type { SavedSheet } from '@/types/preparation'

type ImproveSheetFormProps = {
  onResult: (saved: SavedSheet) => void
  onError: (message: string) => void
}

export function ImproveSheetForm({ onResult, onError }: ImproveSheetFormProps) {
  const [sheetFile, setSheetFile] = useState<File | null>(null)
  const [resourceFiles, setResourceFiles] = useState<FileList | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onError('')

    if (!sheetFile) {
      return onError('Importez votre fiche existante pour l’améliorer.')
    }

    try {
      setSubmitting(true)
      const existingSheet = await extractDocumentText(sheetFile)
      const resources = resourceFiles ? await extractDocuments(resourceFiles) : []
      const result = await improveSheet({
        existingSheet,
        resources,
        notes: notes.trim() || undefined,
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
        <Label htmlFor="existing-sheet">Fiche existante</Label>
        <Input
          id="existing-sheet"
          type="file"
          required
          accept=".pdf,.docx,.odt,.txt,application/pdf,text/plain"
          onChange={(event) => setSheetFile(event.target.files?.[0] ?? null)}
        />
        <p className="text-xs text-muted-foreground">
          PDF, DOCX, ODT ou TXT. La structure de votre fiche est conservée.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="improve-resources">Ressources complémentaires</Label>
        <Input
          id="improve-resources"
          type="file"
          multiple
          accept=".pdf,.docx,.odt,.txt,application/pdf,text/plain"
          onChange={(event) => setResourceFiles(event.target.files)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="improve-notes">Remarques</Label>
        <Textarea
          id="improve-notes"
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Ex. clarifier l’objectif, ajouter de la différenciation..."
        />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        {submitting ? 'Amélioration en cours...' : 'Améliorer ma fiche'}
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
