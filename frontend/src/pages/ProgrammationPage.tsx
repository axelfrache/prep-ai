import { List } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CreateProgrammationForm } from '@/features/programmation/CreateProgrammationForm'
import { ProgrammationResultView } from '@/components/ProgrammationResultView'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import type { SavedProgrammation } from '@/types/preparation'
import { useI18n } from '@/lib/i18n'

export function ProgrammationPage() {
  const [result, setResult] = useState<SavedProgrammation | null>(null)
  const { t } = useI18n()

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t('programmation.title')}</h1>
          <p className="text-muted-foreground">{t('programmation.description')}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/programmations">
            <List className="size-4" />
            {t('programmation.viewList')}
          </Link>
        </Button>
      </div>
      {!result ? (
        <CreateProgrammationForm onSuccess={setResult} />
      ) : (
        <ProgrammationResultView result={result} />
      )}
    </div>
  )
}
