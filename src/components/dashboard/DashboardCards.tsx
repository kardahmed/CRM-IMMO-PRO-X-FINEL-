"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Users, Calendar, ShoppingCart, DollarSign, type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  trend: string;
  color: string;
}

const iconMap: Record<string, LucideIcon> = {
  blue: Users,
  green: Calendar,
  purple: ShoppingCart,
  orange: DollarSign,
};

const colorMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
  green: "bg-green-100 text-green-600 dark:bg-green-900/30",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30",
  orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/30",
};

export function DashboardCard({ label, value, trend, color }: StatCardProps) {
  const Icon = iconMap[color] || Users;
  const isPositive = trend.startsWith("+");

  return (
    <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border-neutral-100 dark:border-neutral-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className={cn("p-2 rounded-lg", colorMap[color])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className={cn(
          "flex items-center gap-1 mt-1 text-xs font-semibold",
          isPositive ? "text-green-500" : "text-red-500"
        )}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>{trend}</span>
          <span className="text-muted-foreground font-normal ml-1">vs mois dernier</span>
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
