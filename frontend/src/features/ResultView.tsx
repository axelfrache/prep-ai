import { Copy, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type {
  BlockType,
  PreparationBlock,
  PreparationPhase,
  PreparationSheet,
} from '@/types/preparation'

type ResultViewProps = {
  sheet: PreparationSheet
}

const anticipationTypes: BlockType[] = ['anticipated_error', 'support', 'extension']

export function ResultView({ sheet }: ResultViewProps) {
  const plannedDuration = sheet.phases.reduce((sum, phase) => sum + phase.durationMinutes, 0)

  return (
    <section aria-live="polite" className="mx-auto w-full max-w-5xl space-y-6 print:max-w-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Fiche générée
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">{sheet.title}</h2>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={() => void copySheet(sheet)}>
            <Copy className="size-4" /> Copier
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" /> Imprimer
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{sheet.subject}</Badge>
        <Badge variant="secondary">{sheet.level}</Badge>
        <Badge variant="secondary">{sheet.durationMinutes} min</Badge>
        <Badge variant="outline">{plannedDuration} min planifiées</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetaCard title="Compétences" items={sheet.competencies} />
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Objectif</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{sheet.objective}</CardContent>
        </Card>
        <MetaCard title="Matériel" items={sheet.materials} />
      </div>

      <Card className="overflow-hidden py-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <Th className="w-[16%]">Phase / Durée</Th>
                <Th className="w-[42%]">Déroulement / Consignes</Th>
                <Th className="w-[18%]">Organisation</Th>
                <Th className="w-[24%]">Anticipations / Différenciation</Th>
              </tr>
            </thead>
            <tbody>
              {sheet.phases.map((phase, index) => (
                <tr key={`${phase.name}-${index}`} className="border-b align-top last:border-0">
                  <td className="p-3">
                    <p className="font-medium">{phase.name}</p>
                    <p className="text-muted-foreground">{phase.durationMinutes} min</p>
                  </td>
                  <td className="p-3">{renderBlocks(phase.blocks, false)}</td>
                  <td className="p-3 text-muted-foreground">{phase.organization}</td>
                  <td className="p-3">{renderAnticipations(phase)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn('p-3 text-xs font-semibold uppercase tracking-wide', className)}>{children}</th>
}

function MetaCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function renderBlocks(blocks: PreparationBlock[], anticipations: boolean) {
  const filtered = blocks.filter((block) =>
    anticipations ? anticipationTypes.includes(block.type) : !anticipationTypes.includes(block.type),
  )
  if (filtered.length === 0) {
    return null
  }
  return (
    <div className="space-y-2">
      {filtered.map((block, index) => (
        <Block key={`${block.type}-${index}`} block={block} />
      ))}
    </div>
  )
}

function renderAnticipations(phase: PreparationPhase) {
  return renderBlocks(phase.blocks, true)
}

function Block({ block }: { block: PreparationBlock }) {
  const label = blockLabel(block.type)
  const isTeacher = block.type === 'teacher_speech' || block.type === 'teacher_relaunch'

  return (
    <p
      className={cn(
        'leading-relaxed',
        isTeacher && 'rounded-md bg-primary/10 px-2 py-1 font-medium text-primary',
      )}
    >
      {label ? <span className="font-semibold">{label} : </span> : null}
      {block.text}
    </p>
  )
}

function blockLabel(type: BlockType): string {
  switch (type) {
    case 'expected_answer':
      return 'Réponse attendue'
    case 'anticipated_error':
      return 'Anticipation'
    case 'support':
      return 'Élèves en difficulté'
    case 'extension':
      return 'Élèves rapides'
    default:
      return ''
  }
}

async function copySheet(sheet: PreparationSheet): Promise<void> {
  const phases = sheet.phases
    .map((phase) => {
      const blocks = phase.blocks
        .map((block) => {
          const label = blockLabel(block.type)
          return `- ${label ? `${label} : ` : ''}${block.text}`
        })
        .join('\n')
      return `${phase.name} (${phase.durationMinutes} min)\n${phase.organization}\n${blocks}`
    })
    .join('\n\n')

  const text = `${sheet.title}\n${sheet.subject} - ${sheet.level} - ${sheet.durationMinutes} min\n\nObjectif : ${sheet.objective}\n\n${phases}`

  try {
    await navigator.clipboard.writeText(text)
    toast.success('Fiche copiée dans le presse-papier.')
  } catch {
    toast.error('Impossible de copier la fiche.')
  }
}
