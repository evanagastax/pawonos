"use client";

import { useState, useEffect, useCallback } from "react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

let toastListeners: Array<(toast: Toast) => void> = [];

export function toast(message: string, type: "success" | "error" | "info" = "info") {
  const id = Math.random().toString(36).slice(2);
  toastListeners.forEach((listener) => listener({ id, message, type }));
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== t.id));
      }, 3000);
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, removeToast };
}