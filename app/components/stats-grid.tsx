import { Progress } from "@/components/ui/progress";

interface StatsCardProps {
  value: string;
  change: {
    value: string;
    trend: "up" | "down";
  };
  icon: React.ReactNode;
  fillColor: string;
}

export function StatsCard({ value, change, icon, fillColor }: StatsCardProps) {
  const isPositive = change.trend === "up";
  const trendColor = isPositive ? "text-emerald-500" : "text-red-500";

  return (
    <div className="relative p-4 lg:p-5 group before:absolute before:inset-y-8 before:right-0 before:w-px before:bg-gradient-to-b before:from-input/30 before:via-input before:to-input/30 last:before:hidden">
      <div className="relative flex items-center gap-4">
        {/* Content */}
        <div>
          {icon}
          <div className="text-xl font-medium my-3 mb-2">{value}</div>
        </div>
      </div>
      
      {/* Progress bar section - full width */}
      <div className="mt-2">
        <Progress value={80} fillColor={fillColor} />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">100GB</span>
          <span className="text-xs text-muted-foreground">1000GB</span>
        </div>
      </div>
    </div>
  );
}

interface StatsGridProps {
  stats: StatsCardProps[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 min-[1200px]:grid-cols-3 border border-border rounded-xl bg-gradient-to-br from-sidebar/60 to-sidebar">
      {stats.map((stat) => (
        <StatsCard key={stat.value} {...stat} />
      ))}
    </div>
  );
}
