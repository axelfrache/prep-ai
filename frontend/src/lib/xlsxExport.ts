import JSZip from 'jszip'
import { translateCurrent } from '@/lib/i18n'
import type { PreparationBlock, PreparationSheet } from '@/types/preparation'

type CellValue = string | number
type StyledCell = { value: CellValue; style?: number }

const styles = {
  default: 1,
  title: 2,
  label: 3,
  header: 4,
  wrap: 5,
}

export async function exportSheetToXlsx(sheet: PreparationSheet): Promise<void> {
  const zip = new JSZip()

  zip.file('[Content_Types].xml', contentTypesXml())
  zip.folder('_rels')?.file('.rels', rootRelsXml())
  const xl = zip.folder('xl')
  xl?.file('workbook.xml', workbookXml())
  xl?.folder('_rels')?.file('workbook.xml.rels', workbookRelsXml())
  xl?.file('styles.xml', stylesXml())
  xl?.folder('worksheets')?.file('sheet1.xml', worksheetXml(sheet))

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  downloadBlob(blob, `${slugify(sheet.title || 'preparation-sheet')}.xlsx`)
}

function worksheetXml(sheet: PreparationSheet): string {
  const rows = sheetToRows(sheet)
  const rowHeights = rowHeightsFor(sheet)
  const sheetRows = rows
    .map((row, rowIndex) => rowXml(row, rowIndex + 1, rowHeights[rowIndex]))
    .join('')

  return xmlHeader(
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetViews>
        <sheetView workbookViewId="0">
          <pane ySplit="7" topLeftCell="A8" activePane="bottomLeft" state="frozen"/>
        </sheetView>
      </sheetViews>
      <cols>
        <col min="1" max="1" width="30" customWidth="1"/>
        <col min="2" max="2" width="10" customWidth="1"/>
        <col min="3" max="3" width="24" customWidth="1"/>
        <col min="4" max="4" width="54" customWidth="1"/>
        <col min="5" max="5" width="46" customWidth="1"/>
        <col min="6" max="6" width="38" customWidth="1"/>
        <col min="7" max="7" width="42" customWidth="1"/>
      </cols>
      <sheetData>${sheetRows}</sheetData>
      <mergeCells count="6">
        <mergeCell ref="A1:G1"/>
        <mergeCell ref="B2:G2"/>
        <mergeCell ref="B3:G3"/>
        <mergeCell ref="B4:G4"/>
        <mergeCell ref="B5:G5"/>
        <mergeCell ref="B6:G6"/>
      </mergeCells>
      <autoFilter ref="A7:G${rows.length}"/>
    </worksheet>`,
  )
}

function sheetToRows(sheet: PreparationSheet): StyledCell[][] {
  return [
    [{ value: sheet.title, style: styles.title }],
    [
      { value: translateCurrent('create.subject'), style: styles.label },
      { value: sheet.subject, style: styles.wrap },
    ],
    [
      { value: translateCurrent('xlsx.levelDuration'), style: styles.label },
      { value: `${sheet.level} - ${sheet.durationMinutes} min`, style: styles.wrap },
    ],
    [
      { value: translateCurrent('xlsx.objective'), style: styles.label },
      { value: sheet.objective, style: styles.wrap },
    ],
    [
      { value: translateCurrent('sheet.skills'), style: styles.label },
      { value: listText(sheet.competencies), style: styles.wrap },
    ],
    [
      { value: translateCurrent('xlsx.materials'), style: styles.label },
      { value: listText(sheet.materials), style: styles.wrap },
    ],
    [
      { value: translateCurrent('xlsx.phase'), style: styles.header },
      { value: translateCurrent('xlsx.duration'), style: styles.header },
      { value: translateCurrent('xlsx.organization'), style: styles.header },
      { value: translateCurrent('sheet.steps'), style: styles.header },
      { value: translateCurrent('xlsx.teacherWords'), style: styles.header },
      { value: translateCurrent('xlsx.expectedAnswers'), style: styles.header },
      { value: translateCurrent('sheet.anticipations'), style: styles.header },
    ],
    ...sheet.phases.map((phase) => [
      { value: phase.name, style: styles.wrap },
      { value: `${phase.durationMinutes} min`, style: styles.wrap },
      { value: phase.organization, style: styles.wrap },
      { value: numberedBlocks(phase.blocks, ['instruction']), style: styles.wrap },
      {
        value: numberedBlocks(phase.blocks, ['teacher_speech', 'teacher_relaunch']),
        style: styles.wrap,
      },
      { value: numberedBlocks(phase.blocks, ['expected_answer']), style: styles.wrap },
      {
        value: numberedBlocks(phase.blocks, ['anticipated_error', 'support', 'extension']),
        style: styles.wrap,
      },
    ]),
  ]
}

function rowHeightsFor(sheet: PreparationSheet): number[] {
  return [30, 34, 34, 52, 60, 72, 28, ...sheet.phases.map((phase) => phaseHeight(phase.blocks))]
}

function phaseHeight(blocks: PreparationBlock[]): number {
  const textLength = blocks.reduce((sum, block) => sum + block.text.length, 0)
  return Math.min(170, Math.max(64, 38 + Math.ceil(textLength / 115) * 16))
}

function rowXml(row: StyledCell[], rowNumber: number, height?: number): string {
  const heightAttrs = height ? ` ht="${height}" customHeight="1"` : ''
  const cells = row
    .map((cell, columnIndex) => cellXml(cell, columnName(columnIndex), rowNumber))
    .join('')
  return `<row r="${rowNumber}"${heightAttrs}>${cells}</row>`
}

function cellXml(cell: StyledCell, column: string, row: number): string {
  const style = cell.style ?? styles.default
  if (typeof cell.value === 'number') {
    return `<c r="${column}${row}" s="${style}"><v>${cell.value}</v></c>`
  }
  return `<c r="${column}${row}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${escapeXml(cell.value)}</t></is></c>`
}

function numberedBlocks(blocks: PreparationBlock[], types: PreparationBlock['type'][]): string {
  const selected = blocks.filter((block) => types.includes(block.type))
  if (selected.length === 0) {
    return ''
  }
  return selected.map((block, index) => `${index + 1}. ${prefix(block)}${block.text}`).join('\n')
}

function prefix(block: PreparationBlock): string {
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

function listText(items: string[]): string {
  return items.length > 0
    ? items.map((item) => `- ${item}`).join('\n')
    : translateCurrent('sheet.notSpecified')
}

function columnName(index: number): string {
  let name = ''
  let current = index + 1
  while (current > 0) {
    const remainder = (current - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    current = Math.floor((current - 1) / 26)
  }
  return name
}

function contentTypesXml(): string {
  return xmlHeader(
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
      <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
      <Default Extension="xml" ContentType="application/xml"/>
      <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
      <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
      <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
    </Types>`,
  )
}

function rootRelsXml(): string {
  return xmlHeader(
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
    </Relationships>`,
  )
}

function workbookXml(): string {
  return xmlHeader(
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
      <sheets>
        <sheet name="${escapeXml(translateCurrent('xlsx.sheetName'))}" sheetId="1" r:id="rId1"/>
      </sheets>
    </workbook>`,
  )
}

function workbookRelsXml(): string {
  return xmlHeader(
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
      <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
    </Relationships>`,
  )
}

function stylesXml(): string {
  return xmlHeader(
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <fonts count="3">
        <font><sz val="11"/><name val="Liberation Sans"/></font>
        <font><b/><sz val="16"/><name val="Liberation Sans"/></font>
        <font><b/><sz val="11"/><name val="Liberation Sans"/></font>
      </fonts>
      <fills count="3">
        <fill><patternFill patternType="none"/></fill>
        <fill><patternFill patternType="solid"><fgColor rgb="FFEAF2FF"/><bgColor indexed="64"/></patternFill></fill>
        <fill><patternFill patternType="solid"><fgColor rgb="FFD9EAF7"/><bgColor indexed="64"/></patternFill></fill>
      </fills>
      <borders count="2">
        <border><left/><right/><top/><bottom/><diagonal/></border>
        <border>
          <left style="thin"><color rgb="FFCDD6E0"/></left>
          <right style="thin"><color rgb="FFCDD6E0"/></right>
          <top style="thin"><color rgb="FFCDD6E0"/></top>
          <bottom style="thin"><color rgb="FFCDD6E0"/></bottom>
          <diagonal/>
        </border>
      </borders>
      <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
      <cellXfs count="6">
        <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
        <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1">
          <alignment wrapText="1" vertical="top"/>
        </xf>
        <xf numFmtId="0" fontId="1" fillId="1" borderId="1" xfId="0" applyAlignment="1">
          <alignment wrapText="1" vertical="center"/>
        </xf>
        <xf numFmtId="0" fontId="2" fillId="1" borderId="1" xfId="0" applyAlignment="1">
          <alignment wrapText="1" vertical="top"/>
        </xf>
        <xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyAlignment="1">
          <alignment wrapText="1" horizontal="center" vertical="center"/>
        </xf>
        <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1">
          <alignment wrapText="1" vertical="top"/>
        </xf>
      </cellXfs>
    </styleSheet>`,
  )
}

function xmlHeader(xml: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${xml}`
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
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

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
