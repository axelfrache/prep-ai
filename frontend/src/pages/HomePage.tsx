import { useState } from 'react'
import { ArrowRight, PlusCircle, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SheetList } from '@/components/SheetList'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageError } from '@/components/PageError'

const actions = [
  {
    to: '/create',
    icon: PlusCircle,
    title: 'Créer une fiche',
    description: 'Générer une séance à partir de quelques informations.',
  },
  {
    to: '/improve',
    icon: Sparkles,
    title: 'Améliorer une fiche',
    description: 'Compléter une fiche existante sans perdre sa structure.',
  },
]

export function HomePage() {
  const [error, setError] = useState('')

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Reprenez une fiche ou lancez une nouvelle préparation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {actions.map((action) => (
          <Link key={action.to} to={action.to} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/50 group-hover:bg-accent/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <action.icon className="size-5" />
                  </span>
                  <div className="flex-1">
                    <CardTitle className="flex items-center justify-between">
                      {action.title}
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className="pt-2">{action.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Mes fiches</h2>
        <PageError message={error} />
        <SheetList onError={setError} />
      </section>
    </div>
  )
}
