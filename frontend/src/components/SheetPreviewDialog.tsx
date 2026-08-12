import { useState } from 'react'
import { Copy, Download } from 'lucide-react'
import { toast } from 'sonner'
import { SheetView, sheetToText } from '@/components/SheetView'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { exportSheetToXlsx } from '@/lib/xlsxExport'
import type { PreparationSheet } from '@/types/preparation'

type SheetPreviewDialogProps = {
  sheet: PreparationSheet
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SheetPreviewDialog({
  sheet,
  trigger,
  open,
  onOpenChange,
}: SheetPreviewDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen

  async function copy() {
    try {
      await navigator.clipboard.writeText(sheetToText(sheet))
      toast.success('Fiche copiée dans le presse-papier.')
    } catch {
      toast.error('Impossible de copier la fiche.')
    }
  }

  async function exportXlsx() {
    try {
      await exportSheetToXlsx(sheet)
      toast.success('Export Excel généré.')
    } catch {
      toast.error("Impossible d'exporter la fiche.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="flex h-[min(92svh,980px)] max-h-[92svh] w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden p-0 sm:w-[calc(100vw-2rem)] sm:max-w-6xl">
        <DialogHeader className="border-b px-4 py-4 text-left sm:px-6">
          <div className="min-w-0">
            <DialogTitle className="pr-8 leading-snug sm:truncate">{sheet.title}</DialogTitle>
            <DialogDescription>Aperçu de la fiche de préparation</DialogDescription>
          </div>
          <div className="flex flex-wrap gap-2 pr-8 sm:absolute sm:right-10 sm:top-4">
            <Button variant="outline" size="sm" onClick={copy}>
              <Copy className="size-4" /> Copier
            </Button>
            <Button variant="outline" size="sm" onClick={exportXlsx}>
              <Download className="size-4" /> Excel
            </Button>
          </div>
        </DialogHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="px-4 py-5 sm:px-6">
            <SheetView sheet={sheet} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
