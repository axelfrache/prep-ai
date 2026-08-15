import { UsersRound } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type ClassAdaptationToggleProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

export function ClassAdaptationToggle({
  checked,
  onCheckedChange,
  className,
}: ClassAdaptationToggleProps) {
  const { t } = useI18n()

  return (
    <Card
      className={cn(
        'flex-row items-start justify-between gap-4 rounded-lg bg-muted/30 px-4 py-3 shadow-none transition-colors',
        checked && 'border-primary/40 bg-primary/5',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground',
            checked && 'bg-primary/10 text-primary',
          )}
        >
          <UsersRound className="size-4" />
        </span>
        <div className="min-w-0 space-y-1">
          <Label htmlFor="adapt-to-class" className="cursor-pointer text-base font-medium">
            {t('class.adaptTitle')}
          </Label>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t('class.adaptDescription')}
          </p>
        </div>
      </div>
      <Switch
        id="adapt-to-class"
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={t('class.adaptAria')}
        className="mt-1"
      />
    </Card>
  )
}
