import {
  ChevronDown,
  FilePenLine,
  FilePlus2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'Accueil', icon: LayoutDashboard, end: true },
  { to: '/create', label: 'Créer', icon: FilePlus2 },
  { to: '/improve', label: 'Améliorer', icon: FilePenLine },
]

export function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:flex-nowrap sm:px-6">
        <NavLink
          to="/"
          className="flex shrink-0 items-center gap-3 rounded-lg pr-2 font-semibold outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Retour au tableau de bord Prep AI"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <GraduationCap className="size-5" />
          </span>
          <span className="text-lg tracking-tight">Prep AI</span>
        </NavLink>

        <nav
          className="order-3 flex w-full items-center gap-1 overflow-x-auto sm:order-none sm:w-auto"
          aria-label="Navigation principale"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )
              }
            >
              <link.icon className="size-4" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto shrink-0">
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
                <span className="hidden max-w-44 truncate text-sm md:inline">{user?.email}</span>
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <span className="block text-xs font-normal text-muted-foreground">Connecté</span>
                <span className="block truncate">{user?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} variant="destructive">
                <LogOut className="size-4" /> Déconnexion
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
