import { downloadBlob, sheetFilename } from '@/lib/exportUtils'
import type { PreparationSheet } from '@/types/preparation'

export function exportSheetToTxt(sheet: PreparationSheet, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  downloadBlob(blob, sheetFilename(sheet, 'txt'))
}
