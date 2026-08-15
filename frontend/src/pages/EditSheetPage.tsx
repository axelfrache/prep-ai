import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Eye, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageError } from '@/components/PageError'
import { SheetPreviewDialog } from '@/components/SheetPreviewDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getSheet, updateSheet } from '@/lib/api'
import { useI18n, type TranslationKey } from '@/lib/i18n'
import type {
  BlockType,
  PreparationBlock,
  PreparationPhase,
  PreparationSheet,
} from '@/types/preparation'

const blockTypes: BlockType[] = [
  'instruction',
  'teacher_speech',
  'expected_answer',
  'teacher_relaunch',
  'anticipated_error',
  'support',
  'extension',
]

const blockLabels: Record<BlockType, TranslationKey> = {
  instruction: 'block.instruction',
  teacher_speech: 'block.teacherSpeech',
  expected_answer: 'block.expectedAnswer',
  teacher_relaunch: 'block.teacherRelaunch',
  anticipated_error: 'block.anticipatedError',
  support: 'block.support',
  extension: 'block.extension',
}

export function EditSheetPage() {
  const { sheetId } = useParams()
  const { t } = useI18n()
  const [sheet, setSheet] = useState<PreparationSheet | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const plannedDuration = useMemo(
    () => sheet?.phases.reduce((sum, phase) => sum + phase.durationMinutes, 0) ?? 0,
    [sheet],
  )

  useEffect(() => {
    if (!sheetId) {
      setError(t('improve.sheetNotFound'))
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    getSheet(sheetId)
      .then((saved) => {
        if (active) {
          setSheet(saved.sheet)
          setError('')
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : t('improve.sheetNotFound'))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [sheetId, t])

  function updateRoot<K extends keyof PreparationSheet>(key: K, value: PreparationSheet[K]) {
    setSheet((current) => (current ? { ...current, [key]: value } : current))
  }

  function updatePhase(index: number, patch: Partial<PreparationPhase>) {
    setSheet((current) => {
      if (!current) return current
      return {
        ...current,
        phases: current.phases.map((phase, i) => (i === index ? { ...phase, ...patch } : phase)),
      }
    })
  }

  function updateBlock(phaseIndex: number, blockIndex: number, patch: Partial<PreparationBlock>) {
    setSheet((current) => {
      if (!current) return current
      return {
        ...current,
        phases: current.phases.map((phase, i) => {
          if (i !== phaseIndex) return phase
          return {
            ...phase,
            blocks: phase.blocks.map((block, j) =>
              j === blockIndex ? { ...block, ...patch } : block,
            ),
          }
        }),
      }
    })
  }

  function addPhase() {
    setSheet((current) => {
      if (!current) return current
      return {
        ...current,
        phases: [
          ...current.phases,
          {
            name: t('editor.newPhase'),
            durationMinutes: 5,
            organization: '',
            blocks: [{ type: 'instruction', text: '' }],
          },
        ],
      }
    })
  }

  function removePhase(index: number) {
    setSheet((current) => {
      if (!current || current.phases.length <= 1) return current
      return { ...current, phases: current.phases.filter((_, i) => i !== index) }
    })
  }

  function addBlock(phaseIndex: number) {
    setSheet((current) => {
      if (!current) return current
      return {
        ...current,
        phases: current.phases.map((phase, i) =>
          i === phaseIndex
            ? { ...phase, blocks: [...phase.blocks, { type: 'instruction', text: '' }] }
            : phase,
        ),
      }
    })
  }

  function removeBlock(phaseIndex: number, blockIndex: number) {
    setSheet((current) => {
      if (!current) return current
      return {
        ...current,
        phases: current.phases.map((phase, i) => {
          if (i !== phaseIndex || phase.blocks.length <= 1) return phase
          return { ...phase, blocks: phase.blocks.filter((_, j) => j !== blockIndex) }
        }),
      }
    })
  }

  async function save() {
    if (!sheetId || !sheet) return
    setSaving(true)
    setError('')
    try {
      const saved = await updateSheet(sheetId, cleanSheet(sheet))
      setSheet(saved.sheet)
      toast.success(t('editor.saved'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('global.unexpectedError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-4">
          <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
            <Link to="/">
              <ArrowLeft className="size-4" /> {t('global.home')}
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{t('editor.title')}</h1>
            <p className="text-muted-foreground">{t('editor.description')}</p>
          </div>
        </div>

        {sheet ? (
          <div className="flex flex-wrap gap-2">
            <SheetPreviewDialog
              sheet={sheet}
              trigger={
                <Button type="button" variant="outline">
                  <Eye className="size-4" />
                  {t('action.preview')}
                </Button>
              }
            />
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saving ? t('editor.saving') : t('editor.save')}
            </Button>
          </div>
        ) : null}
      </div>

      <PageError message={error} />

      {loading ? (
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          {t('editor.loading')}
        </div>
      ) : null}

      {!loading && sheet ? (
        <div className="space-y-6">
          <section className="rounded-lg border bg-card p-4 shadow-xs sm:p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t('editor.fieldTitle')}>
                <Input
                  value={sheet.title}
                  onChange={(event) => updateRoot('title', event.target.value)}
                />
              </Field>
              <Field label={t('create.subject')}>
                <Input
                  value={sheet.subject}
                  onChange={(event) => updateRoot('subject', event.target.value)}
                />
              </Field>
              <Field label={t('create.level')}>
                <Input
                  value={sheet.level}
                  onChange={(event) => updateRoot('level', event.target.value)}
                />
              </Field>
              <Field label={t('create.duration')}>
                <Input
                  type="number"
                  min={1}
                  value={sheet.durationMinutes}
                  onChange={(event) =>
                    updateRoot('durationMinutes', numberFromInput(event.target.value))
                  }
                />
              </Field>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label={t('sheet.objective')}>
                <Textarea
                  className="min-h-24"
                  value={sheet.objective}
                  onChange={(event) => updateRoot('objective', event.target.value)}
                />
              </Field>
              <div className="grid gap-4">
                <Field label={t('sheet.skills')}>
                  <Textarea
                    className="min-h-24"
                    value={sheet.competencies.join('\n')}
                    onChange={(event) => updateRoot('competencies', splitLines(event.target.value))}
                  />
                </Field>
                <Field label={t('sheet.materials')}>
                  <Textarea
                    className="min-h-24"
                    value={sheet.materials.join('\n')}
                    onChange={(event) => updateRoot('materials', splitLines(event.target.value))}
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">{t('editor.phases')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('editor.plannedDuration', { minutes: plannedDuration })}
                </p>
              </div>
              <Button type="button" variant="outline" onClick={addPhase}>
                <Plus className="size-4" />
                {t('editor.addPhase')}
              </Button>
            </div>

            {sheet.phases.map((phase, phaseIndex) => (
              <article
                key={`${phase.name}-${phaseIndex}`}
                className="rounded-lg border bg-card p-4 shadow-xs sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="grid flex-1 gap-4 md:grid-cols-[minmax(0,1.4fr)_8rem_minmax(0,1fr)]">
                    <Field label={t('editor.phaseName')}>
                      <Input
                        value={phase.name}
                        onChange={(event) => updatePhase(phaseIndex, { name: event.target.value })}
                      />
                    </Field>
                    <Field label={t('xlsx.duration')}>
                      <Input
                        type="number"
                        min={1}
                        value={phase.durationMinutes}
                        onChange={(event) =>
                          updatePhase(phaseIndex, {
                            durationMinutes: numberFromInput(event.target.value),
                          })
                        }
                      />
                    </Field>
                    <Field label={t('sheet.organization')}>
                      <Input
                        value={phase.organization}
                        onChange={(event) =>
                          updatePhase(phaseIndex, { organization: event.target.value })
                        }
                      />
                    </Field>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={sheet.phases.length <= 1}
                    onClick={() => removePhase(phaseIndex)}
                    aria-label={t('editor.deletePhase')}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">{t('editor.blocks')}</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock(phaseIndex)}
                    >
                      <Plus className="size-4" />
                      {t('editor.addBlock')}
                    </Button>
                  </div>

                  {phase.blocks.map((block, blockIndex) => (
                    <div
                      key={`${block.type}-${blockIndex}`}
                      className="grid gap-3 rounded-md border bg-muted/20 p-3 md:grid-cols-[13rem_minmax(0,1fr)_2.25rem]"
                    >
                      <Field label={t('editor.blockType')}>
                        <Select
                          value={block.type}
                          onValueChange={(value) =>
                            updateBlock(phaseIndex, blockIndex, { type: value as BlockType })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {blockTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {t(blockLabels[type])}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label={t('editor.blockText')}>
                        <Textarea
                          className="min-h-20"
                          value={block.text}
                          onChange={(event) =>
                            updateBlock(phaseIndex, blockIndex, { text: event.target.value })
                          }
                        />
                      </Field>
                      <div className="flex items-end md:justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                          disabled={phase.blocks.length <= 1}
                          onClick={() => removeBlock(phaseIndex, blockIndex)}
                          aria-label={t('editor.deleteBlock')}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>
        </div>
      ) : null}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function numberFromInput(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function cleanSheet(sheet: PreparationSheet): PreparationSheet {
  return {
    ...sheet,
    title: sheet.title.trim(),
    subject: sheet.subject.trim(),
    level: sheet.level.trim(),
    objective: sheet.objective.trim(),
    competencies: sheet.competencies.map((item) => item.trim()).filter(Boolean),
    materials: sheet.materials.map((item) => item.trim()).filter(Boolean),
    phases: sheet.phases.map((phase) => ({
      ...phase,
      name: phase.name.trim(),
      organization: phase.organization.trim(),
      blocks: phase.blocks.map((block) => ({ ...block, text: block.text.trim() })),
    })),
  }
}
