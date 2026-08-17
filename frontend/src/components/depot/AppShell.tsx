import { useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Layers,
  Users,
  CalendarClock,
  ArrowRightLeft,
  ShieldAlert,
  LogOut,
  Menu,
  Bell,
  TrainFront,
  DatabaseBackup,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiClient } from "@/lib/apiClient";
import { useSession } from "@/hooks/useAppData";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const NAV_ITEMS = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/designations", label: "Designation & Batch", icon: Layers },
  { to: "/app/employees", label: "Employees", icon: Users },
  { to: "/app/retirement", label: "Retirement Forecast", icon: CalendarClock },
  { to: "/app/movements", label: "Transfer & Promotion", icon: ArrowRightLeft },
  { to: "/app/dar", label: "DAR & Rewards", icon: ShieldAlert },
] as const;

function Brand() {
  return (
    <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-card">
        <TrainFront className="size-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-sidebar-foreground">SBC Coaching Depot</p>
        <p className="text-xs text-sidebar-foreground/60">Staff &amp; Duty Management</p>
      </div>
    </div>
  );
}

function NavList({
  disabled = false,
  onNavigate,
}: {
  disabled?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1 px-3 pb-4 pt-4">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.to);
        const content = (
          <>
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </>
        );
        if (disabled) {
          return (
            <span
              key={item.to}
              className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/35"
            >
              {content}
            </span>
          );
        }
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-[inset_3px_0_0_0_var(--sidebar-primary)]"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}

function DataTools() {
  return null; // Backup/Restore removed for production DB
}


export function AppShell({
  title,
  subtitle,
  actions,
  children,
  disabledNav = false,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  disabledNav?: boolean;
}) {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    try {
      await apiClient.logout();
      queryClient.invalidateQueries({ queryKey: ["session"] });
      navigate({ to: "/", replace: true });
    } catch (e) {
      toast.error("Error logging out");
    }
  };

  const initials = (session?.name ?? "HR")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar md:flex">
        <Brand />
        <NavList disabled={disabledNav} />
        <DataTools />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur md:px-6">
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-navy/40 via-amber-accent/50 to-info/40" />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-72 flex-col border-0 bg-sidebar p-0"
            >
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Brand />
              <NavList disabled={disabledNav} onNavigate={() => setOpen(false)} />
              <DataTools />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-foreground md:text-lg">
              {title}
            </h1>
            {subtitle ? (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>


          <div className="hidden items-center gap-2 sm:flex">
            <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-navy to-info text-xs font-semibold text-primary-foreground">
              {initials}
            </div>
            <div className="leading-tight">
              <p className="text-sm font-medium">{session?.name}</p>
              <p className="text-xs text-muted-foreground">{session?.role}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="border-danger/40 bg-danger-soft text-danger hover:bg-danger hover:text-primary-foreground"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </header>

        {actions ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-gradient-to-r from-navy/5 via-card to-info/5 px-4 py-3 md:px-6">
            {actions}
          </div>
        ) : null}

        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
