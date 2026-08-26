import React, { useEffect } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./components/layout";
import { Toaster } from "./components/Toaster";
import { QuickAdd } from "./components/QuickAdd";
import { useStore } from "./store/store";
import { useUIStore } from "./store/uiStore";
import Dashboard from "./pages/Dashboard";
import ChannelPage from "./pages/ChannelPage";
import Pipeline from "./pages/Pipeline";
import VideoWorkspace from "./pages/VideoWorkspace";
import IdeaBank from "./pages/IdeaBank";
import CalendarPage from "./pages/CalendarPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import Strategist from "./pages/Strategist";
import TodayWork from "./pages/TodayWork";
import Settings from "./pages/Settings";

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

export default function App() {
  const theme = useStore((s) => s.settings.theme);
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "n" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(document.activeElement)) return;
      e.preventDefault();
      openQuickAdd();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openQuickAdd]);

  return (
    <HashRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/today" element={<TodayWork />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/video/:id" element={<VideoWorkspace />} />
          <Route path="/ideas" element={<IdeaBank />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/strategist" element={<Strategist />} />
          <Route path="/channel/:id" element={<ChannelPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
      <QuickAdd />
      <Toaster />
    </HashRouter>
  );
}
