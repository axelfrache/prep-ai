import { translateCurrent } from '@/lib/i18n'
import type { PreparationBlock, PreparationSheet } from '@/types/preparation'

export type BlockGroup = {
  instructions: string
  teacherWords: string
  expectedAnswers: string
  anticipations: string
}

type LabeledSection = {
  label: string
  content: string
}

export function sheetFilename(sheet: PreparationSheet, extension: string): string {
  return `${slugify(sheet.title || 'preparation-sheet')}.${extension}`
}

export function sheetList(items: string[]): string {
  return items.length > 0
    ? items.map((item) => `- ${item}`).join('\n')
    : translateCurrent('sheet.notSpecified')
}

export function groupPhaseBlocks(blocks: PreparationBlock[]): BlockGroup {
  return {
    instructions: numberedBlocks(blocks, ['instruction']),
    teacherWords: numberedBlocks(blocks, ['teacher_speech', 'teacher_relaunch']),
    expectedAnswers: numberedBlocks(blocks, ['expected_answer']),
    anticipations: numberedBlocks(blocks, ['anticipated_error', 'support', 'extension']),
  }
}

export function mergedGuidanceText(blocks: BlockGroup): string {
  return labeledSections([
    { label: translateCurrent('xlsx.teacherWords'), content: blocks.teacherWords },
    { label: translateCurrent('xlsx.expectedAnswers'), content: blocks.expectedAnswers },
    { label: translateCurrent('sheet.anticipations'), content: blocks.anticipations },
  ])
}

export function labeledSections(sections: LabeledSection[]): string {
  return sections
    .filter((section) => section.content.trim().length > 0)
    .map((section) => `${section.label}\n${section.content}`)
    .join('\n\n')
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
