"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PenSquare,
  CheckSquare,
  Target,
  Activity,
  Wallet,
  Sparkles,
  Settings,
  Radio,
  Terminal,
  Scale,
  Hammer,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/briefing", label: "Briefing", icon: Radio },
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/checkin", label: "Check-in", icon: PenSquare },
  { href: "/habits", label: "Habits", icon: CheckSquare },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/shiplog", label: "Ship Log", icon: Hammer },
  { href: "/decisions", label: "Decisions", icon: Scale },
  { href: "/insights", label: "Insights", icon: Sparkles },
  { href: "/pulse", label: "Pulse", icon: Activity },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-sidebar md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Terminal className="h-5 w-5 text-primary" />
        <span className="text-lg font-semibold tracking-tight">
          AI<span className="text-primary"> OS</span>
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border px-4 py-3 space-y-1">
        <p className="font-mono text-[10px] text-muted-foreground text-center tracking-wider uppercase">
          from zero to freedom
        </p>
        <p className="text-[9px] text-muted-foreground/50 text-center">
          built by{" "}
          <a href="https://flowsulting.vercel.app" target="_blank" rel="noopener" className="text-primary/50 hover:text-primary transition-colors">
            flowsulting
          </a>
        </p>
      </div>
    </aside>
  );
}
