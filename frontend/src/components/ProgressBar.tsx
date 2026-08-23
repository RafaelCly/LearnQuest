interface ProgressBarProps {
  percent: number;
  completedCount: number;
  totalCount: number;
}

export function ProgressBar({ percent, completedCount, totalCount }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5 text-sm">
        <span className="font-medium text-foreground">Progreso de la ruta</span>
        <span className="text-muted-foreground tabular-nums">
          {completedCount}/{totalCount} nodos &middot; {percent}%
        </span>
      </div>
      <div
        className="h-3 w-full rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
