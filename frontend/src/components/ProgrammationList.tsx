import { useEffect, useState } from 'react'
import { CalendarDays, Eye, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ProgrammationPreviewDialog } from '@/components/ProgrammationPreviewDialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { deleteProgrammation, getProgrammation, listProgrammations } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import type { ProgrammationSummary, SavedProgrammation } from '@/types/preparation'

type ProgrammationListProps = {
  refreshKey?: number
  onError: (message: string) => void
}

export function ProgrammationList({ refreshKey = 0, onError }: ProgrammationListProps) {
  const { t } = useI18n()
  const [items, setItems] = useState<ProgrammationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ProgrammationSummary | null>(null)
  const [preview, setPreview] = useState<SavedProgrammation | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    listProgrammations()
      .then((data) => {
        if (active) setItems(data)
      })
      .catch((err) => onError(err instanceof Error ? err.message : t('programmation.loadError')))
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [refreshKey, onError, t])

  async function openPreview(id: string) {
    setOpeningId(id)
    try {
      const saved = await getProgrammation(id)
      setPreview(saved)
      setPreviewOpen(true)
    } catch (err) {
      onError(err instanceof Error ? err.message : t('programmation.openError'))
    } finally {
      setOpeningId(null)
    }
  }

  async function removeProgrammation(item: ProgrammationSummary) {
    setDeletingId(item.id)
    try {
      await deleteProgrammation(item.id)
      setItems((current) => current.filter((programmation) => programmation.id !== item.id))
      setPendingDelete(null)
      toast.success(t('programmation.deleteSuccess'))
    } catch (err) {
      onError(err instanceof Error ? err.message : t('programmation.deleteError'))
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center">
        <CalendarDays className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">{t('programmation.emptyTitle')}</p>
        <p className="text-sm text-muted-foreground">{t('programmation.emptyDescription')}</p>
      </div>
    )
  }

  return (
    <>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {item.subject} · {item.level} ·{' '}
                {new Date(item.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                disabled={openingId === item.id || deletingId === item.id}
                onClick={() => openPreview(item.id)}
              >
                {openingId === item.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Eye className="size-4" />
                )}
                {t('action.preview')}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive"
                disabled={deletingId === item.id}
                onClick={() => setPendingDelete(item)}
                aria-label={`${t('action.delete')} ${item.title}`}
              >
                {deletingId === item.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {preview ? (
        <ProgrammationPreviewDialog
          result={preview}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
        />
      ) : null}

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open && !deletingId) {
            setPendingDelete(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('programmation.deleteTitle')}</DialogTitle>
            <DialogDescription>{t('programmation.deleteDescription')}</DialogDescription>
          </DialogHeader>

          {pendingDelete ? (
            <div className="rounded-lg border bg-muted/40 px-3 py-2">
              <p className="truncate text-sm font-medium">{pendingDelete.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {pendingDelete.subject} · {pendingDelete.level}
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(deletingId)}
              onClick={() => setPendingDelete(null)}
            >
              {t('action.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!pendingDelete || Boolean(deletingId)}
              onClick={() => {
                if (pendingDelete) {
                  void removeProgrammation(pendingDelete)
                }
              }}
            >
              {deletingId ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {t('action.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
