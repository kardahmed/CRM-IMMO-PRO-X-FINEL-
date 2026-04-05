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
    <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-500 border-neutral-100 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm group overflow-hidden">
      <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 group-hover:opacity-10 transition-opacity", colorMap[color])} />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">{label}</CardTitle>
        <div className={cn("p-2.5 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-500", colorMap[color])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black tracking-tighter tabular-nums">{value}</div>
        <div className={cn(
          "flex items-center gap-1 mt-2 text-[10px] font-black uppercase tracking-tighter",
          isPositive ? "text-emerald-500" : "text-rose-500"
        )}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>{trend}</span>
          <span className="text-muted-foreground/60 font-bold ml-1">{trendDescription || "vs période précédente"}</span>
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
