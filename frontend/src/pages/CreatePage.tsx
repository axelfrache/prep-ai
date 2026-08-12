import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GenerationResult } from '@/components/GenerationResult'
import { PageError } from '@/components/PageError'
import { CreateSheetForm } from '@/features/CreateSheetForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n'
import type { PreparationSheet } from '@/types/preparation'

export function CreatePage() {
  const [error, setError] = useState('')
  const [sheet, setSheet] = useState<PreparationSheet | null>(null)
  const { t } = useI18n()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
          <Link to="/">
            <ArrowLeft className="size-4" /> {t('global.home')}
          </Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t('create.title')}</h1>
          <p className="text-muted-foreground">{t('create.description')}</p>
        </div>
      </div>

      {sheet ? <GenerationResult sheet={sheet} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>{t('create.title')}</CardTitle>
          <CardDescription>{t('create.startHelp')}</CardDescription>
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
