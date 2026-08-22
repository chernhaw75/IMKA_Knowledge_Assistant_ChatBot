import { Bell, ChevronDown, PanelLeftClose, PanelLeftOpen, Moon, Search, Sun } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/AuthContext"
import { useTheme } from "@/lib/ThemeContext"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

interface TopBarProps {
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}

export function TopBar({ sidebarCollapsed = false, onToggleSidebar }: TopBarProps) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="glass flex h-16 shrink-0 items-center gap-4 border-b border-border px-5">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {sidebarCollapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
      </button>

      <h1 className="font-display text-lg font-semibold tracking-tight text-foreground">
        Industrial Maintenance <span className="brand-gradient-text">AI</span>
      </h1>

      <div className="ml-4 flex-1 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documentation..."
            className="h-9 w-full rounded-full border border-border/60 bg-muted/70 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>

        <button
          type="button"
          className="relative rounded-md p-1.5 text-muted-foreground hover:bg-accent"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
            3
          </span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 outline-none hover:bg-accent">
            <Avatar>
              <AvatarFallback>{user ? initials(user.name) : "?"}</AvatarFallback>
            </Avatar>
            <div className="text-left leading-tight">
              <div className="text-sm font-medium text-foreground">{user?.name ?? "Unknown"}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
            <ChevronDown className="size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem variant="destructive" onClick={logout}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
