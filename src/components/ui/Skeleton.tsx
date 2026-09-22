import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/**
 * Skeleton loading placeholder — animé, gris, responsive
 * Utilisation : <Skeleton className="h-48 w-full rounded-2xl" />
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-muted via-muted/70 to-muted",
        "bg-[length:200%_100%]",
        className
      )}
      style={{ animationDuration: "1.5s" }}
    />
  );
}

/**
 * Carte squelette pour le menu (loading state)
 */
export function MenuCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border/40 overflow-hidden">
      <Skeleton className="h-48 md:h-52 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="flex justify-between pt-3 border-t border-border/40">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}
