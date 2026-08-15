import { useEffect, useState } from 'react'
import { Loader2, Plus, Save, Trash2, UsersRound } from 'lucide-react'
import { toast } from 'sonner'
import { PageError } from '@/components/PageError'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getClassProfile, updateClassProfile } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import type { ClassProfile, NeedGroup, StudentProfile } from '@/types/preparation'

const emptyProfile: ClassProfile = {
  level: 'CE2',
  studentCount: 0,
  overallLevel: '',
  classroomContext: '',
  defaultMaterials: '',
  avoidMaterials: '',
  preferredSupports: [],
  defaultSessionDuration: 45,
  pedagogicalPreferences: [],
  needGroups: [],
  students: [],
}

const emptyNeedGroup: NeedGroup = {
  name: '',
  needs: '',
  adaptations: '',
}

const emptyStudent: StudentProfile = {
  name: '',
  strengths: '',
  difficulties: '',
  needs: '',
  adaptations: '',
}

export function ClassProfilePage() {
  const { t } = useI18n()
  const [profile, setProfile] = useState<ClassProfile>(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getClassProfile()
      .then((data) => {
        if (active) {
          setProfile(normalizeProfile(data))
          setError('')
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : t('global.unexpectedError'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [t])

  function update<K extends keyof ClassProfile>(key: K, value: ClassProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }))
  }

  function updateGroup(index: number, patch: Partial<NeedGroup>) {
    update(
      'needGroups',
      profile.needGroups.map((group, i) => (i === index ? { ...group, ...patch } : group)),
    )
  }

  function updateStudent(index: number, patch: Partial<StudentProfile>) {
    update(
      'students',
      profile.students.map((student, i) => (i === index ? { ...student, ...patch } : student)),
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const saved = await updateClassProfile(cleanProfile(profile))
      setProfile(normalizeProfile(saved))
      toast.success(t('class.saved'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('global.unexpectedError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('class.title')}</h1>
        <p className="text-muted-foreground">{t('class.description')}</p>
      </div>

      <PageError message={error} />

      {loading ? (
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          {t('class.loading')}
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UsersRound className="size-5" />
                </span>
                <div>
                  <CardTitle>{t('class.globalProfile')}</CardTitle>
                  <CardDescription>{t('class.globalProfileDescription')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label={t('class.level')} htmlFor="class-level">
                  <Input
                    id="class-level"
                    value={profile.level}
                    onChange={(event) => update('level', event.target.value)}
                    placeholder="CE2"
                  />
                </Field>
                <Field label={t('class.studentCount')} htmlFor="class-student-count">
                  <Input
                    id="class-student-count"
                    type="number"
                    min={0}
                    max={40}
                    value={profile.studentCount}
                    onChange={(event) =>
                      update('studentCount', numberFromInput(event.target.value))
                    }
                  />
                </Field>
                <Field label={t('class.defaultDuration')} htmlFor="class-default-duration">
                  <Input
                    id="class-default-duration"
                    type="number"
                    min={0}
                    max={180}
                    value={profile.defaultSessionDuration}
                    onChange={(event) =>
                      update('defaultSessionDuration', numberFromInput(event.target.value))
                    }
                  />
                </Field>
              </div>
              <Field label={t('class.overallLevel')} htmlFor="class-overall-level">
                <Input
                  id="class-overall-level"
                  value={profile.overallLevel}
                  onChange={(event) => update('overallLevel', event.target.value)}
                  placeholder={t('class.overallLevelPlaceholder')}
                />
              </Field>
              <Field label={t('class.context')} htmlFor="class-context">
                <Textarea
                  id="class-context"
                  className="min-h-24"
                  value={profile.classroomContext}
                  onChange={(event) => update('classroomContext', event.target.value)}
                  placeholder={t('class.contextPlaceholder')}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('class.defaults')}</CardTitle>
              <CardDescription>{t('class.defaultsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t('class.defaultMaterials')} htmlFor="class-default-materials">
                  <Textarea
                    id="class-default-materials"
                    className="min-h-24"
                    value={profile.defaultMaterials}
                    onChange={(event) => update('defaultMaterials', event.target.value)}
                    placeholder={t('materials.availablePlaceholder')}
                  />
                </Field>
                <Field label={t('class.avoidMaterials')} htmlFor="class-avoid-materials">
                  <Textarea
                    id="class-avoid-materials"
                    className="min-h-24"
                    value={profile.avoidMaterials}
                    onChange={(event) => update('avoidMaterials', event.target.value)}
                    placeholder={t('class.avoidMaterialsPlaceholder')}
                  />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <TextListField
                  id="class-preferred-supports"
                  label={t('class.preferredSupports')}
                  value={profile.preferredSupports}
                  onChange={(value) => update('preferredSupports', value)}
                  placeholder={t('class.preferredSupportsPlaceholder')}
                />
                <TextListField
                  id="class-pedagogical-preferences"
                  label={t('class.pedagogicalPreferences')}
                  value={profile.pedagogicalPreferences}
                  onChange={(value) => update('pedagogicalPreferences', value)}
                  placeholder={t('class.pedagogicalPreferencesPlaceholder')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>{t('class.needGroups')}</CardTitle>
                  <CardDescription>{t('class.needGroupsDescription')}</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => update('needGroups', [...profile.needGroups, emptyNeedGroup])}
                >
                  <Plus className="size-4" />
                  {t('class.addGroup')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.needGroups.length === 0 ? (
                <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                  {t('class.noGroups')}
                </p>
              ) : null}

              {profile.needGroups.map((group, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-lg border bg-muted/20 p-3 md:grid-cols-3"
                >
                  <Field label={t('class.groupName')} htmlFor={`group-name-${index}`}>
                    <Input
                      id={`group-name-${index}`}
                      value={group.name}
                      onChange={(event) => updateGroup(index, { name: event.target.value })}
                      placeholder={t('class.groupNamePlaceholder')}
                    />
                  </Field>
                  <Field label={t('class.groupNeeds')} htmlFor={`group-needs-${index}`}>
                    <Textarea
                      id={`group-needs-${index}`}
                      className="min-h-20"
                      value={group.needs}
                      onChange={(event) => updateGroup(index, { needs: event.target.value })}
                    />
                  </Field>
                  <div className="space-y-2">
                    <Field label={t('class.groupAdaptations')} htmlFor={`group-adapt-${index}`}>
                      <Textarea
                        id={`group-adapt-${index}`}
                        className="min-h-20"
                        value={group.adaptations}
                        onChange={(event) =>
                          updateGroup(index, { adaptations: event.target.value })
                        }
                      />
                    </Field>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        update(
                          'needGroups',
                          profile.needGroups.filter((_, i) => i !== index),
                        )
                      }
                    >
                      <Trash2 className="size-4" />
                      {t('action.delete')}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>{t('class.students')}</CardTitle>
                  <CardDescription>{t('class.studentsDescription')}</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => update('students', [...profile.students, emptyStudent])}
                >
                  <Plus className="size-4" />
                  {t('class.addStudent')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.students.length === 0 ? (
                <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                  {t('class.noStudents')}
                </p>
              ) : null}

              {profile.students.map((student, index) => (
                <div key={index} className="space-y-3 rounded-lg border bg-muted/20 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <Field label={t('class.studentName')} htmlFor={`student-name-${index}`}>
                      <Input
                        id={`student-name-${index}`}
                        value={student.name}
                        onChange={(event) => updateStudent(index, { name: event.target.value })}
                        placeholder={t('class.studentNamePlaceholder')}
                      />
                    </Field>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        update(
                          'students',
                          profile.students.filter((_, i) => i !== index),
                        )
                      }
                    >
                      <Trash2 className="size-4" />
                      {t('action.delete')}
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field
                      label={t('class.studentStrengths')}
                      htmlFor={`student-strengths-${index}`}
                    >
                      <Textarea
                        id={`student-strengths-${index}`}
                        className="min-h-20"
                        value={student.strengths}
                        onChange={(event) =>
                          updateStudent(index, { strengths: event.target.value })
                        }
                      />
                    </Field>
                    <Field
                      label={t('class.studentDifficulties')}
                      htmlFor={`student-difficulties-${index}`}
                    >
                      <Textarea
                        id={`student-difficulties-${index}`}
                        className="min-h-20"
                        value={student.difficulties}
                        onChange={(event) =>
                          updateStudent(index, { difficulties: event.target.value })
                        }
                      />
                    </Field>
                    <Field label={t('class.studentNeeds')} htmlFor={`student-needs-${index}`}>
                      <Textarea
                        id={`student-needs-${index}`}
                        className="min-h-20"
                        value={student.needs}
                        onChange={(event) => updateStudent(index, { needs: event.target.value })}
                      />
                    </Field>
                    <Field label={t('class.studentAdaptations')} htmlFor={`student-adapt-${index}`}>
                      <Textarea
                        id={`student-adapt-${index}`}
                        className="min-h-20"
                        value={student.adaptations}
                        onChange={(event) =>
                          updateStudent(index, { adaptations: event.target.value })
                        }
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {submitting ? t('class.saving') : t('class.save')}
          </Button>
        </form>
      )}
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0 flex-1 space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

function TextListField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string
  label: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder: string
}) {
  return (
    <Field label={label} htmlFor={id}>
      <Textarea
        id={id}
        className="min-h-28"
        value={value.join('\n')}
        onChange={(event) => onChange(splitLines(event.target.value))}
        placeholder={placeholder}
      />
    </Field>
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

function cleanProfile(profile: ClassProfile): ClassProfile {
  return {
    ...profile,
    level: profile.level.trim(),
    overallLevel: profile.overallLevel.trim(),
    classroomContext: profile.classroomContext.trim(),
    defaultMaterials: profile.defaultMaterials.trim(),
    avoidMaterials: profile.avoidMaterials.trim(),
    preferredSupports: profile.preferredSupports.map((item) => item.trim()).filter(Boolean),
    pedagogicalPreferences: profile.pedagogicalPreferences
      .map((item) => item.trim())
      .filter(Boolean),
    needGroups: profile.needGroups
      .map((group) => ({
        name: group.name.trim(),
        needs: group.needs.trim(),
        adaptations: group.adaptations.trim(),
      }))
      .filter((group) => group.name || group.needs || group.adaptations),
    students: profile.students
      .map((student) => ({
        name: student.name.trim(),
        strengths: student.strengths.trim(),
        difficulties: student.difficulties.trim(),
        needs: student.needs.trim(),
        adaptations: student.adaptations.trim(),
      }))
      .filter(
        (student) =>
          student.name ||
          student.strengths ||
          student.difficulties ||
          student.needs ||
          student.adaptations,
      ),
  }
}

function normalizeProfile(profile: Partial<ClassProfile>): ClassProfile {
  return {
    ...emptyProfile,
    ...profile,
    preferredSupports: Array.isArray(profile.preferredSupports) ? profile.preferredSupports : [],
    pedagogicalPreferences: Array.isArray(profile.pedagogicalPreferences)
      ? profile.pedagogicalPreferences
      : [],
    needGroups: Array.isArray(profile.needGroups) ? profile.needGroups : [],
    students: Array.isArray(profile.students) ? profile.students : [],
  }
}
