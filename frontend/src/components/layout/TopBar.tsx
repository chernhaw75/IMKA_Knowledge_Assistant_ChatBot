import { Bell, ChevronDown, Menu, Search } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/AuthContext"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function TopBar() {
  const { user, logout } = useAuth()

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background px-5">
      <button
        type="button"
        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
        aria-label="Toggle menu"
      >
        <Menu className="size-5" />
      </button>

      <h1 className="text-lg font-semibold text-foreground">Industrial Maintenance AI</h1>

      <div className="ml-4 flex-1 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documentation..."
            className="h-9 w-full rounded-full border-0 bg-muted pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-4">
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
