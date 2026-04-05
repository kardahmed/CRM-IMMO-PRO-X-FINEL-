"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Legend,
  Line,
  ComposedChart
} from "recharts";
import { Layers } from "lucide-react";

interface ComparisonPoint {
  date: string;
  leads: number;
  visits: number;
}

export function MultiComparisonChart({ data }: { data: ComparisonPoint[] }) {
  // Format date for display (MM/DD)
  const formattedData = data.map(d => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
  }));

  return (
    <Card className="col-span-1 md:col-span-2 border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden group">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-neutral-50 dark:border-neutral-900 mb-4 bg-neutral-50/50 dark:bg-neutral-900/50">
        <div className="space-y-1">
          <CardTitle className="text-lg font-black flex items-center gap-2 uppercase tracking-tight">
            <Layers className="h-4 w-4 text-primary" />
            Analyse Multi-Indicateurs
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Comparaison Leads vs Visites sur la période
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis 
                dataKey="displayDate" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: "bold", fill: "hsl(var(--muted-foreground))" }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: "bold", fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: "12px", 
                  border: "none", 
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  fontWeight: "bold"
                }} 
              />
              <Legend verticalAlign="top" height={36}/>
              <Bar 
                dataKey="leads" 
                name="Nouveaux Leads" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]} 
                barSize={12}
                opacity={0.8}
              />
              <Line 
                type="monotone" 
                dataKey="visits" 
                name="Visites Réalisées" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
