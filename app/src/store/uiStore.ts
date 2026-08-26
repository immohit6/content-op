import { create } from "zustand";
import { uid } from "../lib/utils";

export interface Toast {
  id: string;
  message: string;
  tone: "default" | "success" | "error";
}

interface UIStore {
  toasts: Toast[];
  pushToast: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: string) => void;

  quickAddOpen: boolean;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
}

export const useUIStore = create<UIStore>()((set, get) => ({
  toasts: [],
  pushToast: (message, tone = "default") => {
    const id = uid("toast");
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
    setTimeout(() => get().dismissToast(id), 3200);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  quickAddOpen: false,
  openQuickAdd: () => set({ quickAddOpen: true }),
  closeQuickAdd: () => set({ quickAddOpen: false }),
}));

export function toast(message: string, tone?: Toast["tone"]) {
  useUIStore.getState().pushToast(message, tone);
}
