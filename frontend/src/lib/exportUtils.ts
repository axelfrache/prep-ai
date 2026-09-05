import { translateCurrent } from '@/lib/i18n'
import type { PreparationBlock } from '@/types/preparation'

export type BlockGroup = {
  instructions: string
  teacherWords: string
  expectedAnswers: string
  anticipations: string
}

export type GuidanceExchange = {
  speech: string
  answer: string
}

export function sheetFilename(item: { title: string }, extension: string): string {
  return `${slugify(item.title || 'preparation-sheet')}.${extension}`
}

export function sheetList(items: string[]): string {
  return items.length > 0
    ? items.map((item) => `- ${item}`).join('\n')
    : translateCurrent('sheet.notSpecified')
}

export function numberedList(items: string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n')
}

export function groupPhaseBlocks(blocks: PreparationBlock[]): BlockGroup {
  return {
    instructions: numberedBlocks(blocks, ['instruction']),
    teacherWords: numberedBlocks(blocks, ['teacher_speech', 'teacher_relaunch']),
    expectedAnswers: numberedBlocks(blocks, ['expected_answer']),
    anticipations: numberedBlocks(blocks, ['anticipated_error', 'support', 'extension']),
  }
}

export function guidanceExchanges(blocks: PreparationBlock[]): GuidanceExchange[] {
  const exchanges: GuidanceExchange[] = []
  for (const block of blocks) {
    if (block.type === 'teacher_speech' || block.type === 'teacher_relaunch') {
      exchanges.push({ speech: `${blockPrefix(block)}« ${block.text} »`, answer: '' })
      continue
    }
    if (block.type === 'expected_answer') {
      const last = exchanges.at(-1)
      if (last && !last.answer) {
        last.answer = block.text
      } else {
        exchanges.push({ speech: '', answer: block.text })
      }
    }
  }
  return exchanges
}

export function numberedBlocks(
  blocks: PreparationBlock[],
  types: PreparationBlock['type'][],
): string {
  const selected = blocks.filter((block) => types.includes(block.type))
  if (selected.length === 0) {
    return ''
  }
  return selected
    .map((block, index) => `${index + 1}. ${blockPrefix(block)}${block.text}`)
    .join('\n')
}

export function blockPrefix(block: PreparationBlock): string {
  switch (block.type) {
    case 'teacher_relaunch':
      return translateCurrent('xlsx.relaunchPrefix')
    case 'anticipated_error':
      return translateCurrent('xlsx.possibleErrorPrefix')
    case 'support':
      return translateCurrent('xlsx.supportPrefix')
    case 'extension':
      return translateCurrent('xlsx.extensionPrefix')
    default:
      return ''
  }
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function xmlHeader(xml: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${xml}`
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function slugify(value: string): string {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'preparation-sheet'
}
