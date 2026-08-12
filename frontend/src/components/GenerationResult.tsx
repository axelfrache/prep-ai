import { useEffect, useState } from 'react'
import { CheckCircle2, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SheetPreviewDialog } from '@/components/SheetPreviewDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n'
import type { PreparationSheet } from '@/types/preparation'

export function GenerationResult({ sheet }: { sheet: PreparationSheet }) {
  const [open, setOpen] = useState(false)
  const { t } = useI18n()

  useEffect(() => {
    setOpen(true)
  }, [sheet])

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="font-medium">{t('generation.saved')}</p>
            <p className="text-sm text-muted-foreground">{sheet.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <SheetPreviewDialog
            sheet={sheet}
            open={open}
            onOpenChange={setOpen}
            trigger={
              <Button variant="outline" size="sm">
                <Eye className="size-4" /> {t('action.preview')}
              </Button>
            }
          />
          <Button asChild size="sm">
            <Link to="/">{t('home.mySheets')}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
