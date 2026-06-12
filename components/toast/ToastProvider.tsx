"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/** The quiet toast (PRD 7.2: "Tier 3 — Chrysalis" — no confetti, no modal).
 *  Raised panel, mono figures, 4s auto-dismiss, no entrance animation. */

interface Toast {
  id: number;
  text: string;
  tone: "default" | "gold";
}

const ToastContext = createContext<{
  push: (text: string, tone?: Toast["tone"]) => void;
} | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast needs a ToastProvider above it.");
  return context;
}

const TOAST_MS = 4000;

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const push = useCallback((text: string, tone: Toast["tone"] = "default") => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, text, tone }]);
    timers.current.push(
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== id));
      }, TOAST_MS),
    );
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="rounded-m border border-line bg-raised px-4 py-2.5 text-sm"
            style={{ boxShadow: "var(--shadow-raise)" }}
          >
            <span className={toast.tone === "gold" ? "figure text-gold" : "figure text-primary"}>
              {toast.text}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
