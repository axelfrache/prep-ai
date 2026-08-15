import { useEffect, useState } from 'react'
import { Eye, FilePenLine, FileText, Loader2, Sparkles, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { SheetPreviewDialog } from '@/components/SheetPreviewDialog'
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
import { deleteSheet, getSheet, listSheets } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import type { PreparationSheet, SheetSummary } from '@/types/preparation'

type SheetListProps = {
  refreshKey?: number
  onError: (message: string) => void
}

export function SheetList({ refreshKey = 0, onError }: SheetListProps) {
  const { t } = useI18n()
  const [items, setItems] = useState<SheetSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<SheetSummary | null>(null)
  const [preview, setPreview] = useState<PreparationSheet | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    listSheets()
      .then((data) => {
        if (active) setItems(data)
      })
      .catch((err) => onError(err instanceof Error ? err.message : t('sheet.loadError')))
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
      const saved = await getSheet(id)
      setPreview(saved.sheet)
      setPreviewOpen(true)
    } catch (err) {
      onError(err instanceof Error ? err.message : t('sheet.openError'))
    } finally {
      setOpeningId(null)
    }
  }

  async function removeSheet(item: SheetSummary) {
    setDeletingId(item.id)
    try {
      await deleteSheet(item.id)
      setItems((current) => current.filter((sheet) => sheet.id !== item.id))
      setPendingDelete(null)
      toast.success(t('sheet.deleteSuccess'))
    } catch (err) {
      onError(err instanceof Error ? err.message : t('sheet.deleteError'))
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
        <FileText className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">{t('sheet.emptyTitle')}</p>
        <p className="text-sm text-muted-foreground">{t('sheet.emptyDescription')}</p>
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
                {item.subject} · {item.level} · {item.durationMinutes} min ·{' '}
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
              <Button asChild variant="outline" size="sm">
                <Link to={`/sheets/${item.id}/edit`}>
                  <FilePenLine className="size-4" />
                  {t('action.edit')}
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to={`/improve/${item.id}`}>
                  <Sparkles className="size-4" />
                  {t('action.improve')}
                </Link>
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
        <SheetPreviewDialog sheet={preview} open={previewOpen} onOpenChange={setPreviewOpen} />
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
            <DialogTitle>{t('sheet.deleteTitle')}</DialogTitle>
            <DialogDescription>{t('sheet.deleteDescription')}</DialogDescription>
          </DialogHeader>

          {pendingDelete ? (
            <div className="rounded-lg border bg-muted/40 px-3 py-2">
              <p className="truncate text-sm font-medium">{pendingDelete.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {pendingDelete.subject} · {pendingDelete.level} · {pendingDelete.durationMinutes}{' '}
                min
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
                  void removeSheet(pendingDelete)
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
