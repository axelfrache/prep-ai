import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GenerationResult } from '@/components/GenerationResult'
import { PageError } from '@/components/PageError'
import { CreateSheetForm } from '@/features/CreateSheetForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { PreparationSheet } from '@/types/preparation'

export function CreatePage() {
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
          <h1 className="text-2xl font-semibold tracking-tight">Créer une fiche</h1>
          <p className="text-muted-foreground">
            Indiquez ce que vous voulez travailler, Prep AI prépare le déroulement de la séance.
          </p>
        </div>
      </div>

      {sheet ? <GenerationResult sheet={sheet} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle séance</CardTitle>
          <CardDescription>Matière, niveau et durée suffisent pour démarrer.</CardDescription>
        </CardHeader>
        <CardContent>
          <PageError message={error} />
          <div className={error ? 'mt-4' : ''}>
            <CreateSheetForm
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
