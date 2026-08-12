import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GenerationResult } from '@/components/GenerationResult'
import { PageError } from '@/components/PageError'
import { ImproveSheetForm } from '@/features/ImproveSheetForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { PreparationSheet } from '@/types/preparation'

export function ImprovePage() {
  const [error, setError] = useState('')
  const [sheet, setSheet] = useState<PreparationSheet | null>(null)

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
            Importez votre fiche actuelle, Prep AI la complète sans perdre sa structure.
          </p>
        </div>
      </div>

      {sheet ? <GenerationResult sheet={sheet} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Fiche à améliorer</CardTitle>
          <CardDescription>Formats acceptés : PDF, DOCX, ODT, TXT.</CardDescription>
        </CardHeader>
        <CardContent>
          <PageError message={error} />
          <div className={error ? 'mt-4' : ''}>
            <ImproveSheetForm
              onResult={(saved) => {
                setError('')
                setSheet(saved.sheet)
              }}
              onError={setError}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
