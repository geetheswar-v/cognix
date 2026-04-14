import { cn } from "@/lib/utils"

type LogoProps = {
  className?: string
  collapseAware?: boolean
}

export function Logo({ className, collapseAware = false }: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <div className="grid size-9 place-items-center rounded-lg bg-linear-to-br from-amber-400 via-red-500 to-blue-600 text-[11px] font-black text-white shadow-lg shadow-black/20">
        CX
      </div>
      <span
        className={cn(
          "text-lg font-semibold tracking-tight",
          collapseAware && "group-data-[collapsible=icon]:hidden"
        )}
      >
        Cognix
      </span>
    </div>
  )
}
