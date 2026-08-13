import JSZip from 'jszip'
import { translateCurrent } from '@/lib/i18n'
import {
  downloadBlob,
  escapeXml,
  groupPhaseBlocks,
  sheetFilename,
  sheetList,
} from '@/lib/exportUtils'
import type { PreparationSheet } from '@/types/preparation'

export async function exportSheetToOdt(sheet: PreparationSheet): Promise<void> {
  const zip = new JSZip()
  zip.file('mimetype', 'application/vnd.oasis.opendocument.text', { compression: 'STORE' })
  zip.file('content.xml', contentXml(sheet))
  zip.file('styles.xml', stylesXml())
  zip.file('meta.xml', metaXml())
  zip.file('META-INF/manifest.xml', manifestXml())

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.oasis.opendocument.text',
  })
  downloadBlob(blob, sheetFilename(sheet, 'odt'))
}

function contentXml(sheet: PreparationSheet): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <office:document-content
    xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
    xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
    xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
    xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
    office:version="1.3">
    <office:automatic-styles>
      <style:style style:name="HeaderCell" style:family="table-cell">
        <style:table-cell-properties style:background-color="#eaf2ff" fo:padding="0.08in" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"/>
      </style:style>
      <style:style style:name="BodyCell" style:family="table-cell">
        <style:table-cell-properties fo:padding="0.08in" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"/>
      </style:style>
    </office:automatic-styles>
    <office:body>
      <office:text>
        <text:h text:outline-level="1">${escapeXml(sheet.title)}</text:h>
        ${metaTable(sheet)}
        <text:h text:outline-level="2">${escapeXml(translateCurrent('docx.sequence'))}</text:h>
        ${phaseTable(sheet)}
      </office:text>
    </office:body>
  </office:document-content>`
}

function metaTable(sheet: PreparationSheet): string {
  const rows = [
    [translateCurrent('create.subject'), sheet.subject],
    [translateCurrent('xlsx.levelDuration'), `${sheet.level} - ${sheet.durationMinutes} min`],
    [translateCurrent('sheet.objective'), sheet.objective],
    [translateCurrent('sheet.skills'), sheetList(sheet.competencies)],
    [translateCurrent('sheet.materials'), sheetList(sheet.materials)],
  ]
  return table(rows.map(([label, value]) => row([cell(label, true), cell(value)])))
}

function phaseTable(sheet: PreparationSheet): string {
  const header = row([
    cell(translateCurrent('xlsx.phase'), true),
    cell(translateCurrent('xlsx.duration'), true),
    cell(translateCurrent('xlsx.organization'), true),
    cell(translateCurrent('sheet.steps'), true),
    cell(translateCurrent('xlsx.teacherWords'), true),
    cell(translateCurrent('xlsx.expectedAnswers'), true),
    cell(translateCurrent('sheet.anticipations'), true),
  ])
  const rows = sheet.phases.map((phase) => {
    const blocks = groupPhaseBlocks(phase.blocks)
    return row([
      cell(phase.name),
      cell(`${phase.durationMinutes} min`),
      cell(phase.organization),
      cell(blocks.instructions),
      cell(blocks.teacherWords),
      cell(blocks.expectedAnswers),
      cell(blocks.anticipations),
    ])
  })
  return table([header, ...rows])
}

function table(rows: string[]): string {
  return `<table:table>${rows.join('')}</table:table>`
}

function row(cells: string[]): string {
  return `<table:table-row>${cells.join('')}</table:table-row>`
}

function cell(value: string, header = false): string {
  const paragraphs = (value || ' ')
    .split(/\r?\n/)
    .map((line) => `<text:p>${escapeXml(line)}</text:p>`)
  return `<table:table-cell table:style-name="${header ? 'HeaderCell' : 'BodyCell'}" office:value-type="string">${paragraphs.join('')}</table:table-cell>`
}

function stylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <office:document-styles
    xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
    xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
    xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
    office:version="1.3">
    <office:styles>
      <style:default-style style:family="paragraph"/>
    </office:styles>
  </office:document-styles>`
}

function metaXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <office:document-meta xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" office:version="1.3">
    <office:meta/>
  </office:document-meta>`
}

function manifestXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3">
    <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text"/>
    <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
    <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
    <manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
  </manifest:manifest>`
}
