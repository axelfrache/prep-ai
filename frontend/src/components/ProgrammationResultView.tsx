import { Copy, Printer } from 'lucide-react'
import type { ProgrammationResult } from '@/types/preparation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useI18n } from '@/lib/i18n'

type ProgrammationResultViewProps = {
  result: ProgrammationResult
}

export function ProgrammationResultView({ result }: ProgrammationResultViewProps) {
  const { programmation } = result
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Programmation générée</p>
          <h2 className="text-2xl font-semibold tracking-tight">{programmation.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void copyResult(result)}>
            <Copy className="mr-2 size-4" /> {t('action.copy')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 size-4" /> Imprimer
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
          {programmation.subject}
        </span>
        <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
          {programmation.level}
        </span>
      </div>

      <div className="space-y-8">
        {programmation.periods.map((period, pIndex) => (
          <Card key={pIndex}>
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg">
                {period.name} {period.theme ? `- ${period.theme}` : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/4">Séquence / Thème</TableHead>
                    <TableHead className="w-1/3">Compétences</TableHead>
                    <TableHead className="w-5/12">Séances (Progression)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {period.sequences.map((seq, sIndex) => (
                    <TableRow key={sIndex}>
                      <TableCell className="align-top">
                        <div className="font-medium">{seq.title}</div>
                        {seq.theme && (
                          <div className="mt-1 text-sm text-muted-foreground">{seq.theme}</div>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        <ul className="list-inside list-disc space-y-1 text-sm">
                          {seq.competencies.map((comp, cIndex) => (
                            <li key={cIndex} className="text-muted-foreground">
                              {comp}
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell className="align-top">
                        <ol className="list-inside list-decimal space-y-1 text-sm">
                          {seq.sessions.map((ses, sesIndex) => (
                            <li key={sesIndex} className="text-muted-foreground">
                              {ses.name}
                            </li>
                          ))}
                        </ol>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

async function copyResult(result: ProgrammationResult): Promise<void> {
  const { programmation } = result

  let text = `${programmation.title}\n${programmation.subject} - ${programmation.level}\n\n`

  for (const period of programmation.periods) {
    text += `### ${period.name} ${period.theme ? `- ${period.theme}` : ''}\n\n`
    for (const seq of period.sequences) {
      text += `Séquence : ${seq.title}\n`
      if (seq.theme) text += `Thème : ${seq.theme}\n`
      text += `Compétences :\n`
      for (const comp of seq.competencies) {
        text += `- ${comp}\n`
      }
      text += `Séances :\n`
      for (let i = 0; i < seq.sessions.length; i++) {
        text += `${i + 1}. ${seq.sessions[i].name}\n`
      }
      text += `\n`
    }
  }

  await navigator.clipboard.writeText(text)
}
