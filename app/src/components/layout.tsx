import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { cx } from "../lib/utils";
import { useStore } from "../store/store";
import { useUIStore } from "../store/uiStore";

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cx("h-4.5 w-4.5", className)} strokeWidth={1.8} stroke="currentColor">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ICONS = {
  home: "M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9",
  board: "M4 4h16v16H4zM9 4v16M15 4v4",
  bulb: "M9 18h6M10 21h4M7 10a5 5 0 1 1 10 0c0 2-1.2 3-2 4.2-.4.6-.5 1-.5 1.8h-5c0-.8-.1-1.2-.5-1.8C8.2 13 7 12 7 10Z",
  calendar: "M7 3v4M17 3v4M4 8h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z",
  chart: "M4 20V10M11 20V4M18 20v-7",
  strategist: "M12 3l2.4 5 5.6.5-4.2 3.8 1.3 5.5L12 15l-5.1 2.8 1.3-5.5L4 8.5l5.6-.5Z",
  today: "M8 4v3m8-3v3M5 8h14M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1ZM9 12h2m-2 4h6",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z",
};

const NAV = [
  { to: "/", label: "Dashboard", icon: ICONS.home, end: true },
  { to: "/today", label: "Today's Work", icon: ICONS.today },
  { to: "/pipeline", label: "Pipeline", icon: ICONS.board },
  { to: "/ideas", label: "Idea Bank", icon: ICONS.bulb },
  { to: "/calendar", label: "Calendar", icon: ICONS.calendar },
  { to: "/analytics", label: "Analytics", icon: ICONS.chart },
  { to: "/strategist", label: "AI Strategist", icon: ICONS.strategist },
];

function navClass({ isActive }: { isActive: boolean }) {
  return cx(
    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive ? "bg-accent/15 text-accent-soft" : "text-base-300 hover:bg-base-800 hover:text-base-100"
  );
}

export function Sidebar() {
  const navigate = useNavigate();
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);
  const channels = useStore((s) => s.channels);
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-base-700/60 bg-base-950 px-3 py-4 lg:flex lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
      <button onClick={() => navigate("/")} className="mb-4 flex items-center gap-2 px-2 text-left">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">C</div>
        <div>
          <div className="text-sm font-semibold text-base-100 leading-none">Content OS</div>
          <div className="text-[11px] text-base-400 leading-none mt-0.5">your content command centre</div>
        </div>
      </button>

      <button onClick={openQuickAdd} className="btn-primary mb-4 w-full justify-center gap-2">
        + Quick add
        <kbd className="rounded border border-white/25 px-1 py-0.5 text-[10px] font-semibold leading-none text-white/80">N</kbd>
      </button>

      <nav className="flex flex-col gap-0.5">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
            <Icon d={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 px-2 text-[11px] font-semibold uppercase tracking-wide text-base-500">Channels</div>
      <nav className="mt-1 flex flex-col gap-0.5">
        {channels.map((c) => (
          <NavLink key={c.id} to={`/channel/${c.id}`} className={navClass}>
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
            <span className="truncate">{c.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-0.5 pt-4">
        <NavLink to="/settings" className={navClass}>
          <Icon d={ICONS.settings} />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}

const MOBILE_NAV = [
  { to: "/", label: "Home", icon: ICONS.home, end: true },
  { to: "/today", label: "Today", icon: ICONS.today },
  { to: "/pipeline", label: "Pipeline", icon: ICONS.board },
  { to: "/ideas", label: "Ideas", icon: ICONS.bulb },
  { to: "/strategist", label: "AI", icon: ICONS.strategist },
];

export function MobileNav() {
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);
  return (
    <>
      <button
        onClick={openQuickAdd}
        className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-2xl font-light text-white shadow-lg lg:hidden"
        aria-label="Quick add"
      >
        +
      </button>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-base-700/60 bg-base-950/95 backdrop-blur lg:hidden pb-[env(safe-area-inset-bottom)]">
        {MOBILE_NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cx(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
              isActive ? "text-accent-soft" : "text-base-400"
            )
          }
        >
            <Icon d={item.icon} className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-base-950">
      <Sidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-base-100 sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-sm text-base-400">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
