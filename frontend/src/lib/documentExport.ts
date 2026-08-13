import JSZip from 'jszip'
import { translateCurrent } from '@/lib/i18n'
import {
  downloadBlob,
  escapeXml,
  groupPhaseBlocks,
  sheetFilename,
  sheetList,
  xmlHeader,
} from '@/lib/exportUtils'
import type { PreparationSheet } from '@/types/preparation'

type CellOptions = {
  header?: boolean
  label?: boolean
  width?: number
}

type ParagraphOptions = {
  bold?: boolean
  fontSize?: number
  spacingAfter?: number
  style?: 'Heading1' | 'Normal' | 'Title'
}

const contentWidth = 15400
const metaColumnWidths = [2500, contentWidth - 2500]
const phaseColumnWidths = [1900, 800, 1600, 3400, 3000, 2200, 2500]

export async function exportSheetToDocx(sheet: PreparationSheet): Promise<void> {
  const zip = new JSZip()

  zip.file('[Content_Types].xml', docxContentTypesXml())
  zip.folder('_rels')?.file('.rels', docxRootRelsXml())
  const word = zip.folder('word')
  word?.file('document.xml', docxDocumentXml(sheet))
  word?.file('styles.xml', docxStylesXml())
  word?.folder('_rels')?.file('document.xml.rels', docxDocumentRelsXml())

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  downloadBlob(blob, sheetFilename(sheet, 'docx'))
}

function docxDocumentXml(sheet: PreparationSheet): string {
  return xmlHeader(
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        ${paragraph(sheet.title, { style: 'Title' })}
        ${metaTable(sheet)}
        ${paragraph(translateCurrent('docx.sequence'), { style: 'Heading1' })}
        ${phaseTable(sheet)}
        <w:sectPr>
          <w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>
          <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="360" w:footer="360" w:gutter="0"/>
        </w:sectPr>
      </w:body>
    </w:document>`,
  )
}

function metaTable(sheet: PreparationSheet): string {
  const rows = [
    [translateCurrent('create.subject'), sheet.subject],
    [translateCurrent('xlsx.levelDuration'), `${sheet.level} - ${sheet.durationMinutes} min`],
    [translateCurrent('sheet.objective'), sheet.objective],
    [translateCurrent('sheet.skills'), sheetList(sheet.competencies)],
    [translateCurrent('sheet.materials'), sheetList(sheet.materials)],
  ]
  return table(
    rows.map(([label, value]) =>
      tableRow([
        tableCell(label, { label: true, width: metaColumnWidths[0] }),
        tableCell(value, { width: metaColumnWidths[1] }),
      ]),
    ),
    metaColumnWidths,
  )
}

function phaseTable(sheet: PreparationSheet): string {
  const header = tableRow([
    tableCell(translateCurrent('xlsx.phase'), { header: true, width: phaseColumnWidths[0] }),
    tableCell(translateCurrent('xlsx.duration'), { header: true, width: phaseColumnWidths[1] }),
    tableCell(translateCurrent('xlsx.organization'), {
      header: true,
      width: phaseColumnWidths[2],
    }),
    tableCell(translateCurrent('sheet.steps'), { header: true, width: phaseColumnWidths[3] }),
    tableCell(translateCurrent('xlsx.teacherWords'), {
      header: true,
      width: phaseColumnWidths[4],
    }),
    tableCell(translateCurrent('xlsx.expectedAnswers'), {
      header: true,
      width: phaseColumnWidths[5],
    }),
    tableCell(translateCurrent('sheet.anticipations'), {
      header: true,
      width: phaseColumnWidths[6],
    }),
  ])
  const rows = sheet.phases.map((phase) => {
    const blocks = groupPhaseBlocks(phase.blocks)
    return tableRow([
      tableCell(phase.name, { width: phaseColumnWidths[0] }),
      tableCell(`${phase.durationMinutes} min`, { width: phaseColumnWidths[1] }),
      tableCell(phase.organization, { width: phaseColumnWidths[2] }),
      tableCell(blocks.instructions, { width: phaseColumnWidths[3] }),
      tableCell(blocks.teacherWords, { width: phaseColumnWidths[4] }),
      tableCell(blocks.expectedAnswers, { width: phaseColumnWidths[5] }),
      tableCell(blocks.anticipations, { width: phaseColumnWidths[6] }),
    ])
  })
  return table([header, ...rows], phaseColumnWidths)
}

function table(rows: string[], columnWidths: number[]): string {
  return `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="${columnWidths.reduce((sum, width) => sum + width, 0)}" w:type="dxa"/>
      <w:tblLayout w:type="fixed"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:left w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:right w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:insideH w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:insideV w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
      </w:tblBorders>
      <w:tblCellMar>
        <w:top w:w="90" w:type="dxa"/>
        <w:left w:w="90" w:type="dxa"/>
        <w:bottom w:w="90" w:type="dxa"/>
        <w:right w:w="90" w:type="dxa"/>
      </w:tblCellMar>
    </w:tblPr>
    <w:tblGrid>
      ${columnWidths.map((width) => `<w:gridCol w:w="${width}"/>`).join('')}
    </w:tblGrid>
    ${rows.join('')}
  </w:tbl>`
}

function tableRow(cells: string[]): string {
  return `<w:tr><w:trPr><w:cantSplit/></w:trPr>${cells.join('')}</w:tr>`
}

function tableCell(value: string, options: CellOptions = {}): string {
  const fill = cellFill(options)
  const paragraphs = splitLines(value || ' ').map((line) =>
    paragraph(line || ' ', {
      bold: options.header || options.label,
      fontSize: options.header ? 19 : 20,
      spacingAfter: 0,
    }),
  )
  const width = options.width ?? 0
  return `<w:tc>
    <w:tcPr>
      <w:tcW w:w="${width}" w:type="dxa"/>
      <w:vAlign w:val="top"/>
      ${fill}
    </w:tcPr>
    ${paragraphs.join('')}
  </w:tc>`
}

function cellFill(options: CellOptions): string {
  if (options.header) {
    return '<w:shd w:val="clear" w:color="auto" w:fill="D9EAF7"/>'
  }
  if (options.label) {
    return '<w:shd w:val="clear" w:color="auto" w:fill="EAF2FF"/>'
  }
  return ''
}

function paragraph(text: string, options: ParagraphOptions = {}): string {
  const style =
    options.style && options.style !== 'Normal' ? `<w:pStyle w:val="${options.style}"/>` : ''
  const spacingAfter = options.spacingAfter ?? 80
  const paragraphProperties = `<w:pPr>${style}<w:spacing w:after="${spacingAfter}" w:line="240" w:lineRule="auto"/></w:pPr>`
  const runProperties = runPropertiesXml(options)

  return `<w:p>
    ${paragraphProperties}
    <w:r>${runProperties}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>
  </w:p>`
}

function runPropertiesXml(options: ParagraphOptions): string {
  const size = options.fontSize ? `<w:sz w:val="${options.fontSize}"/>` : ''
  const bold = options.bold ? '<w:b/>' : ''
  if (!size && !bold) {
    return ''
  }
  return `<w:rPr>${bold}${size}</w:rPr>`
}

function splitLines(value: string): string[] {
  return value.split(/\r?\n/)
}

function docxContentTypesXml(): string {
  return xmlHeader(
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
      <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
      <Default Extension="xml" ContentType="application/xml"/>
      <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
      <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
    </Types>`,
  )
}

function docxRootRelsXml(): string {
  return xmlHeader(
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
    </Relationships>`,
  )
}

function docxDocumentRelsXml(): string {
  return xmlHeader(
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`,
  )
}

function docxStylesXml(): string {
  return xmlHeader(
    `<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
        <w:name w:val="Normal"/>
        <w:rPr><w:sz w:val="20"/></w:rPr>
      </w:style>
      <w:style w:type="paragraph" w:styleId="Title">
        <w:name w:val="Title"/>
        <w:rPr><w:b/><w:sz w:val="34"/></w:rPr>
        <w:pPr><w:spacing w:after="220"/></w:pPr>
      </w:style>
      <w:style w:type="paragraph" w:styleId="Heading1">
        <w:name w:val="Heading 1"/>
        <w:rPr><w:b/><w:sz w:val="26"/></w:rPr>
        <w:pPr><w:spacing w:before="260" w:after="140"/></w:pPr>
      </w:style>
      <w:style w:type="paragraph" w:styleId="Strong">
        <w:name w:val="Strong"/>
        <w:rPr><w:b/><w:sz w:val="20"/></w:rPr>
      </w:style>
    </w:styles>`,
  )
}
