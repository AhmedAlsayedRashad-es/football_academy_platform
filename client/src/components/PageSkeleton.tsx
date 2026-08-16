import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";

// ─── Page-level skeleton loader ───────────────────────────────────────────────
export function PageSkeleton({ rows = 3, cards = 4 }: { rows?: number; cards?: number }) {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-4 w-40 rounded" />
      </div>
      {/* Stat cards */}
      <div className={`grid gap-4 grid-cols-2 md:grid-cols-${Math.min(cards, 4)}`}>
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-8 w-16 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        ))}
      </div>
      {/* Table / list rows */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-5 w-32 rounded" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48 rounded" />
                <Skeleton className="h-3 w-32 rounded" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Chart skeleton ────────────────────────────────────────────────────────────
export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <Skeleton className="h-5 w-32 rounded" />
      <Skeleton className={`w-full rounded-lg`} style={{ height }} />
    </div>
  );
}

// ─── Player card skeleton ──────────────────────────────────────────────────────
export function PlayerCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Empty state component ─────────────────────────────────────────────────────
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  iconColor?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  iconColor = "text-muted-foreground",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className={`rounded-full bg-muted p-6 mb-4 ${iconColor}`}>
        <Icon className="h-10 w-10" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
