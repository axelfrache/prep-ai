import { useState } from 'react'
import { ChevronDown, Copy, Download, FileSpreadsheet, FileText } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useI18n } from '@/lib/i18n'
import { exportSheetToDocx } from '@/lib/documentExport'
import { exportSheetToOdt } from '@/lib/odtExport'
import { exportSheetToTxt } from '@/lib/textExport'
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
  const { t } = useI18n()

  async function copy() {
    try {
      await navigator.clipboard.writeText(sheetToText(sheet, t))
      toast.success(t('sheet.copySuccess'))
    } catch {
      toast.error(t('sheet.copyError'))
    }
  }

  async function exportXlsx() {
    try {
      await exportSheetToXlsx(sheet)
      toast.success(t('sheet.exportSuccess'))
    } catch {
      toast.error(t('sheet.exportError'))
    }
  }

  async function exportDocx() {
    try {
      await exportSheetToDocx(sheet)
      toast.success(t('sheet.exportDocumentSuccess'))
    } catch {
      toast.error(t('sheet.exportError'))
    }
  }

  async function exportOdt() {
    try {
      await exportSheetToOdt(sheet)
      toast.success(t('sheet.exportDocumentSuccess'))
    } catch {
      toast.error(t('sheet.exportError'))
    }
  }

  function exportTxt() {
    try {
      exportSheetToTxt(sheet, sheetToText(sheet, t))
      toast.success(t('sheet.exportTextSuccess'))
    } catch {
      toast.error(t('sheet.exportError'))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="flex h-[min(92svh,980px)] max-h-[92svh] w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden p-0 sm:w-[calc(100vw-2rem)] sm:max-w-6xl">
        <DialogHeader className="border-b px-4 py-4 text-left sm:px-6">
          <div className="min-w-0">
            <DialogTitle className="pr-8 leading-snug sm:truncate">{sheet.title}</DialogTitle>
            <DialogDescription>{t('sheet.previewDescription')}</DialogDescription>
          </div>
          <div className="flex flex-wrap gap-2 pr-8 sm:absolute sm:right-10 sm:top-4">
            <Button variant="outline" size="sm" onClick={copy}>
              <Copy className="size-4" /> {t('action.copy')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="size-4" />
                  {t('action.export')}
                  <ChevronDown className="size-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => void exportDocx()}>
                  <FileText className="size-4" />
                  {t('action.exportWord')}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void exportOdt()}>
                  <FileText className="size-4" />
                  {t('action.exportOdt')}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void exportXlsx()}>
                  <FileSpreadsheet className="size-4" />
                  {t('action.exportExcel')}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={exportTxt}>
                  <FileText className="size-4" />
                  {t('action.exportTxt')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
