import { useEffect, useState } from 'react'
import { FileText, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSheet, listSheets } from '@/lib/api'
import type { SavedSheet, SheetSummary } from '@/types/preparation'

type SheetHistoryProps = {
  refreshKey: number
  onOpen: (sheet: SavedSheet) => void
  onError: (message: string) => void
}

export function SheetHistory({ refreshKey, onOpen, onError }: SheetHistoryProps) {
  const [items, setItems] = useState<SheetSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [openingId, setOpeningId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    listSheets()
      .then((data) => {
        if (active) setItems(data)
      })
      .catch((err) => onError(err instanceof Error ? err.message : 'Chargement impossible.'))
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [refreshKey, onError])

  async function handleOpen(id: string) {
    setOpeningId(id)
    try {
      const saved = await getSheet(id)
      onOpen(saved)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Ouverture impossible.')
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Mes fiches</CardTitle>
        {loading ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : <RefreshCw className="hidden" />}
      </CardHeader>
      <CardContent>
        {!loading && items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune fiche enregistrée pour le moment.</p>
        ) : (
          <ul className="divide-y">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.subject} · {item.level} · {item.durationMinutes} min ·{' '}
                    {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={openingId === item.id}
                  onClick={() => handleOpen(item.id)}
                >
                  {openingId === item.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <FileText className="size-4" />
                  )}
                  Ouvrir
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
