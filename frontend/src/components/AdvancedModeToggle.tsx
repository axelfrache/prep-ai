import { Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ShineBorder } from '@/components/ui/shine-border'
import { Switch } from '@/components/ui/switch'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type AdvancedModeToggleProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

export function AdvancedModeToggle({
  checked,
  onCheckedChange,
  className,
}: AdvancedModeToggleProps) {
  const { t } = useI18n()

  return (
    <Card
      className={cn(
        'relative flex-row items-start justify-between gap-4 overflow-hidden rounded-lg border-transparent bg-muted/30 px-4 py-3 shadow-none transition-colors',
        checked && 'bg-primary/5',
        className,
      )}
    >
      <ShineBorder shineColor={['#A07CFE', '#FE8FB5', '#FFBE7B']} />
      <div className="relative z-10 flex min-w-0 items-start gap-3">
        <span
          className={cn(
            'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground',
            checked && 'bg-primary/10 text-primary',
          )}
        >
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0 space-y-1">
          <Label htmlFor="advanced-mode" className="cursor-pointer text-base font-medium">
            {t('advanced.title')}
          </Label>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t('advanced.description')}
          </p>
        </div>
      </div>
      <Switch
        id="advanced-mode"
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={t('advanced.aria')}
        className="relative z-10 mt-1"
      />
    </Card>
  )
}
