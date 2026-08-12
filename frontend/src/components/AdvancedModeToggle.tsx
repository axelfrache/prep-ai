import { Sparkles } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3 transition-colors',
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
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0 space-y-1">
          <Label htmlFor="advanced-mode" className="cursor-pointer text-base font-medium">
            Raisonnement avancé
          </Label>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Utilise Gemini 3.6 Flash pour un meilleur rendu. Les quotas sont plus limités.
          </p>
        </div>
      </div>
      <Switch
        id="advanced-mode"
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label="Activer le raisonnement avancé"
        className="mt-1"
      />
    </div>
  )
}
