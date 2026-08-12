import { useEffect, useState } from 'react'
import { Loader2, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { PageError } from '@/components/PageError'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth'
import { useI18n, type Locale } from '@/lib/i18n'

export function SettingsPage() {
  const { user, updateProfile } = useAuth()
  const { locale, setLocale, t } = useI18n()
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setEmail(user?.email ?? '')
  }, [user?.email])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await updateProfile(email.trim(), password.trim() || undefined)
      setPassword('')
      toast.success(t('settings.saved'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('global.unexpectedError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.description')}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserRound className="size-5" />
            </span>
            <div>
              <CardTitle>{t('settings.account')}</CardTitle>
              <CardDescription>{t('settings.profile')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PageError message={error} />

          <form className={error ? 'mt-4 space-y-5' : 'space-y-5'} onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="settings-email">{t('login.email')}</Label>
              <Input
                id="settings-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t('settings.emailHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-password">{t('settings.password')}</Label>
              <Input
                id="settings-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t('settings.passwordPlaceholder')}
              />
              <p className="text-xs text-muted-foreground">{t('settings.passwordHelp')}</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="settings-language">{t('settings.language')}</Label>
              <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
                <SelectTrigger id="settings-language" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t('settings.languageDescription')}</p>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {submitting ? t('settings.saving') : t('settings.save')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
