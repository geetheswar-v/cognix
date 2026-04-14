"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { IconCircleCheck, IconInfoCircle, IconX } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type ToastKind = "success" | "error" | "info"

type ToastInput = {
  title: string
  description?: string
  kind?: ToastKind
  durationMs?: number
}

type ToastRecord = ToastInput & {
  id: string
}

type ToastContextValue = {
  toast: (input: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastRecord[]>([])

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    ({ durationMs = 4200, kind = "info", ...input }: ToastInput) => {
      const id = crypto.randomUUID()
      setItems((current) => [...current, { id, kind, ...input }])

      window.setTimeout(() => {
        dismiss(id)
      }, durationMs)
    },
    [dismiss]
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {items.map((item) => {
          const isError = item.kind === "error"
          return (
            <div
              key={item.id}
              className={cn(
                "pointer-events-auto rounded-2xl border bg-card p-3 text-card-foreground shadow-lg ring-1 ring-black/5",
                isError ? "border-destructive/35" : "border-border"
              )}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {isError ? (
                    <IconInfoCircle className="size-4 text-destructive" />
                  ) : (
                    <IconCircleCheck className="size-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  {item.description ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  ) : null}
                </div>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="-mt-1 -mr-1"
                  onClick={() => dismiss(item.id)}
                >
                  <IconX className="size-3" />
                  <span className="sr-only">Dismiss notification</span>
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider")
  }

  return context
}
