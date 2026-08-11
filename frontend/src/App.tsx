import { useState } from 'react'
import { GraduationCap, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreateSheetForm } from '@/features/CreateSheetForm'
import { ImproveSheetForm } from '@/features/ImproveSheetForm'
import { ResultView } from '@/features/ResultView'
import type { PreparationResult } from '@/types/preparation'

function App() {
  const [result, setResult] = useState<PreparationResult | null>(null)
  const [error, setError] = useState('')

  function handleResult(next: PreparationResult) {
    setResult(next)
    setError('')
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:py-16">
        <header className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <GraduationCap className="size-6" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Prep AI</h1>
          <p className="max-w-xl text-muted-foreground">
            Préparez rapidement une fiche de séance directement exploitable en classe, pour le
            Cycle 2 / CE2.
          </p>
        </header>

        <Card className="mx-auto w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Assistant de préparation</CardTitle>
            <CardDescription>
              Créez une fiche de zéro ou améliorez une fiche existante sans perdre sa structure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="create" onValueChange={() => setError('')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create">Créer une fiche</TabsTrigger>
                <TabsTrigger value="improve">Améliorer une fiche</TabsTrigger>
              </TabsList>

              {error ? (
                <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <TabsContent value="create" className="mt-6">
                <CreateSheetForm onResult={handleResult} onError={setError} />
              </TabsContent>
              <TabsContent value="improve" className="mt-6">
                <ImproveSheetForm onResult={handleResult} onError={setError} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {result ? <ResultView result={result} /> : null}

        <footer className="text-center text-xs text-muted-foreground">
          Évitez d'inclure des données personnelles concernant les élèves.
        </footer>
      </div>
    </div>
  )
}

export default App
