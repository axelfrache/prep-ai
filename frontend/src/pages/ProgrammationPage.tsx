import { CreateProgrammationForm } from '@/features/programmation/CreateProgrammationForm'
import { ProgrammationResultView } from '@/components/ProgrammationResultView'
import { useState } from 'react'
import type { ProgrammationResult } from '@/types/preparation'
import { useI18n } from '@/lib/i18n'

export function ProgrammationPage() {
  const [result, setResult] = useState<ProgrammationResult | null>(null)
  const { t } = useI18n()

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('programmation.title')}</h1>
        <p className="text-muted-foreground">{t('programmation.description')}</p>
      </div>
      {!result ? (
        <CreateProgrammationForm onSuccess={setResult} />
      ) : (
        <ProgrammationResultView result={result} />
      )}
    </div>
  )
}
