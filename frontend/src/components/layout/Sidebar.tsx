import { NavLink } from "react-router-dom"
import { LayoutDashboard, MessageSquare, FileText, ClipboardList, Settings, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/", label: "AI Dashboard", icon: LayoutDashboard, end: true },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/sops", label: "SOPs", icon: ClipboardList },
]

export function Sidebar() {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600">
          <Wrench className="size-5 text-white" />
        </div>
        <span className="text-[15px] font-semibold leading-tight">
          Industrial
          <br />
          Maintenance AI
        </span>
      </div>

      <nav className="mt-2 flex flex-col gap-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                isActive && "bg-blue-600 text-white hover:bg-blue-600 hover:text-white",
              )
            }
          >
            <item.icon className="size-4.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="my-3 border-t border-sidebar-border" />

      <nav className="flex flex-col gap-1 px-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
              isActive && "bg-blue-600 text-white hover:bg-blue-600 hover:text-white",
            )
          }
        >
          <Settings className="size-4.5" />
          Settings
        </NavLink>
      </nav>

      <div className="mt-auto p-4">
        <div className="rounded-xl bg-sidebar-accent p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-sidebar-foreground/90">AI System Status</span>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
              Healthy
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-sidebar-foreground/60">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Last updated: 10:15 AM
          </div>
        </div>
      </div>
    </aside>
  )
}
