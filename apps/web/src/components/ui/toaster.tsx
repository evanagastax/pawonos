"use client";

import { useToast } from "@/hooks/use-toast";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg animate-in slide-in-from-right-full",
            toast.type === "success" && "bg-green-600 text-white",
            toast.type === "error" && "bg-destructive text-destructive-foreground",
            toast.type === "info" && "bg-background border text-foreground"
          )}
        >
          {toast.type === "success" && <CheckCircle className="h-4 w-4 flex-shrink-0" />}
          {toast.type === "error" && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
          {toast.type === "info" && <Info className="h-4 w-4 flex-shrink-0" />}
          <p className="text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 flex-shrink-0 rounded p-1 hover:bg-white/20"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}