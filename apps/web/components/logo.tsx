import { cn } from "@/lib/utils"

type LogoProps = {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <div className="grid size-9 place-items-center rounded-lg bg-linear-to-br from-amber-400 via-red-500 to-blue-600 text-[11px] font-black text-white shadow-lg shadow-black/20">
        CX
      </div>
      <span className="text-lg font-semibold tracking-tight">Cognix</span>
    </div>
  )
}
