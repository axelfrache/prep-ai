import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ProgrammationResultView } from '@/components/ProgrammationResultView'
import type { SavedProgrammation } from '@/types/preparation'

type ProgrammationPreviewDialogProps = {
  result: SavedProgrammation
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProgrammationPreviewDialog({
  result,
  open,
  onOpenChange,
}: ProgrammationPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(92svh,980px)] max-h-[92svh] w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden p-0 sm:w-[calc(100vw-2rem)] sm:max-w-6xl">
        <DialogTitle className="sr-only">{result.programmation.title}</DialogTitle>
        <ScrollArea className="min-h-0 flex-1">
          <div className="px-4 py-5 sm:px-6">
            <ProgrammationResultView result={result} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
