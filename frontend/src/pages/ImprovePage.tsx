import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { GenerationResult } from '@/components/GenerationResult'
import { PageError } from '@/components/PageError'
import { ImproveSheetForm } from '@/features/ImproveSheetForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getSheet } from '@/lib/api'
import type { PreparationSheet, SavedSheet } from '@/types/preparation'

export function ImprovePage() {
  const { sheetId } = useParams()
  const [error, setError] = useState('')
  const [sheet, setSheet] = useState<PreparationSheet | null>(null)
  const [source, setSource] = useState<SavedSheet | null>(null)
  const [loadingSource, setLoadingSource] = useState(Boolean(sheetId))

  useEffect(() => {
    if (!sheetId) {
      setSource(null)
      setLoadingSource(false)
      return
    }

    let active = true
    setLoadingSource(true)
    getSheet(sheetId)
      .then((saved) => {
        if (active) {
          setSource(saved)
          setError('')
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Fiche introuvable.')
        }
      })
      .finally(() => {
        if (active) setLoadingSource(false)
      })

    return () => {
      active = false
    }
  }, [sheetId])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
          <Link to="/">
            <ArrowLeft className="size-4" /> Accueil
          </Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Améliorer une fiche</h1>
          <p className="text-muted-foreground">
            {sheetId
              ? 'Prep AI repart de cette fiche enregistrée et génère une version améliorée.'
              : 'Importez votre fiche actuelle, Prep AI la complète sans perdre sa structure.'}
          </p>
        </div>
      </div>

      {sheet ? <GenerationResult sheet={sheet} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>{sheetId ? 'Fiche enregistrée à améliorer' : 'Fiche à améliorer'}</CardTitle>
          <CardDescription>
            {sheetId
              ? 'La fiche actuelle est récupérée depuis votre historique.'
              : 'Formats acceptés : PDF, DOCX, ODT, TXT.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PageError message={error} />
          <div className={error ? 'mt-4' : ''}>
            {loadingSource ? (
              <p className="text-sm text-muted-foreground">Chargement de la fiche...</p>
            ) : sheetId && !source ? null : (
              <ImproveSheetForm
                savedSheetId={source?.id}
                savedSheetTitle={source?.sheet.title}
                onResult={(saved) => {
                  setError('')
                  setSheet(saved.sheet)
                }}
                onError={setError}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
