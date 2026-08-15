import { ChevronDown, LayoutDashboard, LogOut, Settings, UsersRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth'
import { useI18n, type TranslationKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type NavItem = {
  to: string
  labelKey: TranslationKey
  icon: React.ComponentType<{ className?: string }>
  end?: boolean
}

const navItems: NavItem[] = [
  { to: '/', labelKey: 'global.home', icon: LayoutDashboard, end: true },
  { to: '/class', labelKey: 'nav.class', icon: UsersRound },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings },
]

export function Navbar() {
  const { user, logout } = useAuth()
  const { t } = useI18n()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:px-6 lg:flex-nowrap">
        <NavLink
          to="/"
          className="flex shrink-0 items-center gap-3 rounded-lg pr-1 font-semibold outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={t('nav.returnHome')}
        >
          <span className="flex size-10 items-center justify-center overflow-hidden rounded-xl bg-primary/10">
            <img src="/icon.png" alt="" className="size-8 object-contain" draggable={false} />
          </span>
          <span className="text-lg tracking-tight">PrepAI</span>
        </NavLink>

        <nav
          className="order-3 flex w-full gap-1 rounded-xl bg-secondary/70 p-1 sm:order-none sm:mx-2 sm:w-auto sm:bg-transparent sm:p-0"
          aria-label={t('nav.main')}
        >
          {navItems.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'inline-flex h-9 min-w-0 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors sm:justify-start',
                  isActive
                    ? 'bg-background text-foreground shadow-xs sm:bg-primary/10 sm:text-primary sm:shadow-none'
                    : 'text-muted-foreground hover:bg-background/70 hover:text-foreground sm:hover:bg-secondary',
                )
              }
            >
              <link.icon className="size-4" />
              <span className="truncate">{t(link.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 gap-2 rounded-full px-1.5 pr-2 text-muted-foreground hover:text-foreground"
              >
                <Avatar className="size-7">
                  <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
                    {initials(user?.email)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-36 truncate text-sm xl:inline">{user?.email}</span>
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <span className="block text-xs font-normal text-muted-foreground">
                  {t('nav.connected')}
                </span>
                <span className="block truncate">{user?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} variant="destructive">
                <LogOut className="size-4" /> {t('nav.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

function initials(email?: string): string {
  if (!email) {
    return '?'
  }
  return email.slice(0, 2).toUpperCase()
}
