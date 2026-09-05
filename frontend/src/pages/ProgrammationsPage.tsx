import { useState } from 'react'
import { PageError } from '@/components/PageError'
import { ProgrammationList } from '@/components/ProgrammationList'
import { useI18n } from '@/lib/i18n'

export function ProgrammationsPage() {
  const [error, setError] = useState('')
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('programmation.listTitle')}</h1>
      </div>
      <PageError message={error} />
      <ProgrammationList onError={setError} />
    </div>
  )
}
