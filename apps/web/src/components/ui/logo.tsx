import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl font-bold",
                className
            )}
        >
            C
        </div>
    );
}
