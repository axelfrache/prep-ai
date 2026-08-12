import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useI18n, type TranslationKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type {
  BlockType,
  PreparationBlock,
  PreparationPhase,
  PreparationSheet,
} from '@/types/preparation'

const anticipationTypes: BlockType[] = ['anticipated_error', 'support', 'extension']

export function SheetView({ sheet }: { sheet: PreparationSheet }) {
  const plannedDuration = sheet.phases.reduce((sum, phase) => sum + phase.durationMinutes, 0)
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{sheet.subject}</Badge>
        <Badge variant="secondary">{sheet.level}</Badge>
        <Badge variant="secondary">{sheet.durationMinutes} min</Badge>
        <Badge variant="outline">{t('sheet.plannedMinutes', { minutes: plannedDuration })}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetaBlock title={t('sheet.skills')} items={sheet.competencies} />
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold">{t('sheet.objective')}</h3>
          <p className="text-sm text-muted-foreground">{sheet.objective}</p>
        </div>
        <MetaBlock title={t('sheet.materials')} items={sheet.materials} />
      </div>

      <div className="space-y-3 lg:hidden">
        {sheet.phases.map((phase, index) => (
          <PhaseCard key={`${phase.name}-${index}`} phase={phase} />
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border lg:block">
        <Table className="min-w-[1120px] table-fixed">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[16%]">{t('sheet.phaseDuration')}</TableHead>
              <TableHead className="w-[42%]">{t('sheet.steps')}</TableHead>
              <TableHead className="w-[18%]">{t('sheet.organization')}</TableHead>
              <TableHead className="w-[24%]">{t('sheet.anticipations')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sheet.phases.map((phase, index) => (
              <TableRow key={`${phase.name}-${index}`} className="align-top">
                <TableCell className="whitespace-normal p-3 align-top">
                  <p className="font-medium">{phase.name}</p>
                  <p className="text-muted-foreground">{phase.durationMinutes} min</p>
                </TableCell>
                <TableCell className="whitespace-normal p-3 align-top">
                  {renderBlocks(phase.blocks, false, t)}
                </TableCell>
                <TableCell className="whitespace-normal p-3 align-top text-muted-foreground">
                  {phase.organization}
                </TableCell>
                <TableCell className="whitespace-normal p-3 align-top">
                  {renderAnticipations(phase, t)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function MetaBlock({ title, items }: { title: string; items: string[] }) {
  const { t } = useI18n()
  const safeItems = items.length > 0 ? items : [t('sheet.notSpecified')]
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
        {safeItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function PhaseCard({ phase }: { phase: PreparationPhase }) {
  const { t } = useI18n()

  return (
    <article className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-medium">{phase.name}</h3>
          <p className="text-sm text-muted-foreground">{phase.durationMinutes} min</p>
        </div>
        <Badge variant="outline" className="max-w-full whitespace-normal text-left">
          {phase.organization}
        </Badge>
      </div>

      <PhaseSection title={t('sheet.steps')}>{renderBlocks(phase.blocks, false, t)}</PhaseSection>

      <PhaseSection title={t('sheet.anticipations')}>
        {renderAnticipations(phase, t) ?? (
          <p className="text-sm text-muted-foreground">{t('sheet.noAnticipation')}</p>
        )}
      </PhaseSection>
    </article>
  )
}

function PhaseSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="text-xs font-semibold uppercase text-muted-foreground">{title}</h4>
      {children}
    </section>
  )
}

function renderBlocks(
  blocks: PreparationBlock[],
  anticipations: boolean,
  t: (key: TranslationKey) => string,
) {
  const filtered = blocks.filter((block) =>
    anticipations
      ? anticipationTypes.includes(block.type)
      : !anticipationTypes.includes(block.type),
  )
  if (filtered.length === 0) {
    return null
  }
  return (
    <div className="space-y-2">
      {filtered.map((block, index) => (
        <Block key={`${block.type}-${index}`} block={block} t={t} />
      ))}
    </div>
  )
}

function renderAnticipations(phase: PreparationPhase, t: (key: TranslationKey) => string) {
  return renderBlocks(phase.blocks, true, t)
}

function Block({ block, t }: { block: PreparationBlock; t: (key: TranslationKey) => string }) {
  const label = blockLabel(block.type, t)
  const isTeacher = block.type === 'teacher_speech' || block.type === 'teacher_relaunch'

  return (
    <p
      className={cn(
        'text-sm leading-relaxed',
        'break-words whitespace-pre-wrap',
        isTeacher && 'rounded-md bg-primary/10 px-2 py-1 font-medium text-primary',
      )}
    >
      {label ? <span className="font-semibold">{label} : </span> : null}
      {block.text}
    </p>
  )
}

export function blockLabel(type: BlockType, t: (key: TranslationKey) => string): string {
  switch (type) {
    case 'expected_answer':
      return t('sheet.expectedAnswer')
    case 'anticipated_error':
      return t('sheet.anticipated')
    case 'support':
      return t('sheet.difficultStudents')
    case 'extension':
      return t('sheet.fastStudents')
    default:
      return ''
  }
}

export function sheetToText(
  sheet: PreparationSheet,
  t: (key: TranslationKey) => string = (key) => key,
): string {
  const phases = sheet.phases
    .map((phase) => {
      const blocks = phase.blocks
        .map((block) => {
          const label = blockLabel(block.type, t)
          return `- ${label ? `${label} : ` : ''}${block.text}`
        })
        .join('\n')
      return `${phase.name} (${phase.durationMinutes} min)\n${phase.organization}\n${blocks}`
    })
    .join('\n\n')

  return `${sheet.title}\n${sheet.subject} - ${sheet.level} - ${sheet.durationMinutes} min\n\n${t('sheet.objective')} : ${sheet.objective}\n\n${phases}`
}
