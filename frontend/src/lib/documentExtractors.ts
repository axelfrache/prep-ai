import JSZip from 'jszip'
import mammoth from 'mammoth'
import * as pdfjs from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import type { ExtractedDocument } from '@/types/preparation'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const MIN_TEXT_LENGTH = 20
const MAX_FILE_BYTES = 8 * 1024 * 1024

export class DocumentExtractionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DocumentExtractionError'
  }
}

export function extractDocuments(files: FileList | File[]): Promise<ExtractedDocument[]> {
  return Promise.all(Array.from(files).map(extractDocumentText))
}

export async function extractDocumentText(file: File): Promise<ExtractedDocument> {
  if (file.size > MAX_FILE_BYTES) {
    throw new DocumentExtractionError(
      `${file.name} est trop volumineux. Utilisez un fichier de moins de 8 Mo.`,
    )
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const text =
    extension === 'pdf'
      ? await extractPdfText(file)
      : extension === 'docx'
        ? await extractDocxText(file)
        : extension === 'odt'
          ? await extractOdtText(file)
          : extension === 'txt'
            ? await file.text()
            : unsupportedFile(file.name)

  const normalized = normalizeText(text)

  if (normalized.length < MIN_TEXT_LENGTH) {
    if (extension === 'pdf') {
      throw new DocumentExtractionError(
        `${file.name} semble être un PDF scanné ou sans texte exploitable.`,
      )
    }
    throw new DocumentExtractionError(`Aucun texte exploitable n'a pu être extrait de ${file.name}.`)
  }

  return { name: file.name, type: extension, text: normalized }
}

async function extractPdfText(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer())
  const loadingTask = pdfjs.getDocument({ data })
  const document = await loadingTask.promise
  const pages: string[] = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const content = await page.getTextContent()
    const pageText = content.items.map((item) => ('str' in item ? item.str : '')).join(' ')
    pages.push(pageText)
  }

  return pages.join('\n\n')
}

async function extractDocxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

async function extractOdtText(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const content = zip.file('content.xml')

  if (!content) {
    throw new DocumentExtractionError(`${file.name} n'est pas un fichier ODT valide.`)
  }

  const xml = await content.async('text')
  const document = new DOMParser().parseFromString(xml, 'application/xml')
  const paragraphs = Array.from(document.getElementsByTagName('text:p'))
    .map((node) => node.textContent?.trim() ?? '')
    .filter(Boolean)

  return paragraphs.join('\n')
}

function unsupportedFile(fileName: string): never {
  throw new DocumentExtractionError(
    `${fileName} n'est pas supporté. Formats acceptés : PDF, DOCX, ODT, TXT.`,
  )
}

function normalizeText(text: string): string {
  return text
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}
