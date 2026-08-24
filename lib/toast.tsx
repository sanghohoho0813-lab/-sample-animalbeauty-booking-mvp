"use client";

import { CheckCircle2, Info, XCircle } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastKind = "success" | "info" | "error";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  leaving?: boolean;
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS: Record<ToastKind, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-mint-500" />,
  info: <Info className="h-5 w-5 text-mint-500" />,
  error: <XCircle className="h-5 w-5 text-coral-500" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: string, kind: ToastKind = "success") => {
    idRef.current += 1;
    const id = idRef.current;
    setItems((prev) => [...prev.slice(-2), { id, kind, message }]);
    setTimeout(() => {
      setItems((prev) =>
        prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
      );
    }, 2400);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 2700);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-card-hover transition-all duration-300 ${
              t.leaving ? "-translate-y-2 opacity-0" : "animate-fade-in-up"
            }`}
            role="status"
          >
            {ICONS[t.kind]}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
