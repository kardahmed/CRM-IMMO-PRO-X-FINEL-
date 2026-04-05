"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Users, Calendar, ShoppingCart, DollarSign, type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  trend: string;
  trendDescription?: string;
  color: string;
}

const iconMap: Record<string, LucideIcon> = {
  blue: Users,
  green: Calendar,
  purple: ShoppingCart,
  orange: DollarSign,
};

const colorMap: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30",
  green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30",
  purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/30",
  orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/30",
};

export function DashboardCard({ label, value, trend, trendDescription, color }: StatCardProps) {
  const Icon = iconMap[color] || Users;
  const isPositive = trend.startsWith("+");

  return (
    <Card className="border-none shadow-stripe hover:shadow-stripe-lg transition-all duration-500 rounded-[20px] bg-white group hover:-translate-y-1 relative overflow-hidden">
      <div className={cn("absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700", colorMap[color])} />
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6 relative z-10">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 transition-colors group-hover:text-primary">
          {label}
        </CardTitle>
        <div className={cn("p-2 rounded-[14px] shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:rotate-3", colorMap[color])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 relative z-10">
        <div className="text-4xl font-black tracking-tighter tabular-nums text-neutral-900 group-hover:text-primary transition-colors duration-500">
          {value}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
            isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
          )}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend}
          </div>
          <span className="text-[10px] font-black uppercase tracking-tight text-muted-foreground/40 italic">
            {trendDescription || "vs période précédente"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardCardsGrid({ stats }: { stats: StatCardProps[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <DashboardCard key={i} {...stat} />
      ))}
    </div>
  );
}
