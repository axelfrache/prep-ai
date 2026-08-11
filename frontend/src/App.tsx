import { useState } from 'react'
import { AlertCircle, GraduationCap, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AuthPage } from '@/features/AuthPage'
import { CreateSheetForm } from '@/features/CreateSheetForm'
import { ImproveSheetForm } from '@/features/ImproveSheetForm'
import { ResultView } from '@/features/ResultView'
import { SheetHistory } from '@/features/SheetHistory'
import { useAuth } from '@/lib/auth'
import type { PreparationSheet, SavedSheet } from '@/types/preparation'

function App() {
  const { user, logout } = useAuth()

  if (!user) {
    return <AuthPage />
  }

  return <Workspace email={user.email} onLogout={logout} />
}

function Workspace({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [sheet, setSheet] = useState<PreparationSheet | null>(null)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  function showSheet(next: PreparationSheet) {
    setSheet(next)
    setError('')
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }

  function handleGenerated(saved: SavedSheet) {
    setRefreshKey((key) => key + 1)
    showSheet(saved.sheet)
  }

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:py-14">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <p className="font-semibold leading-tight">Prep AI</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="size-4" /> Déconnexion
          </Button>
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
                <CreateSheetForm onResult={handleGenerated} onError={setError} />
              </TabsContent>
              <TabsContent value="improve" className="mt-6">
                <ImproveSheetForm onResult={handleGenerated} onError={setError} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <SheetHistory
          refreshKey={refreshKey}
          onOpen={(saved) => showSheet(saved.sheet)}
          onError={setError}
        />

        {sheet ? <ResultView sheet={sheet} /> : null}

        <footer className="text-center text-xs text-muted-foreground">
          Évitez d'inclure des données personnelles concernant les élèves.
        </footer>
      </div>
    </div>
  )
}

export default App
