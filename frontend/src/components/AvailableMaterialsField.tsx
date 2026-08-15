import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useI18n, type TranslationKey } from '@/lib/i18n'

type AvailableMaterialsFieldProps = {
  id: string
  value: string
  onChange: (value: string) => void
}

const suggestionKeys: TranslationKey[] = [
  'materials.suggestionBoard',
  'materials.suggestionSlates',
  'materials.suggestionProjector',
  'materials.suggestionNotebook',
  'materials.suggestionTextbook',
  'materials.suggestionPhotocopies',
  'materials.suggestionManipulatives',
]

export function AvailableMaterialsField({ id, value, onChange }: AvailableMaterialsFieldProps) {
  const { t } = useI18n()

  function addSuggestion(suggestion: string) {
    const items = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    if (items.includes(suggestion)) {
      return
    }
    onChange([...items, suggestion].join(', '))
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{t('materials.availableLabel')}</Label>
      <Textarea
        id={id}
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t('materials.availablePlaceholder')}
      />
      <div className="flex flex-wrap gap-2">
        {suggestionKeys.map((key) => {
          const suggestion = t(key)
          return (
            <Button
              key={key}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 rounded-full px-3 text-xs"
              onClick={() => addSuggestion(suggestion)}
            >
              {suggestion}
            </Button>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">{t('materials.availableHelp')}</p>
    </div>
  )
}
