"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";

interface PipelineStep {
  name: string;
  value: number;
}

const COLORS = [
  "hsl(199, 89%, 48%)", // Sky
  "hsl(217, 91%, 60%)", // Blue
  "hsl(239, 84%, 67%)", // Indigo
  "hsl(262, 52%, 47%)", // Violet
  "hsl(271, 91%, 65%)", // Purple
  "hsl(316, 70%, 50%)", // Pink
];

export function PipelineChart({ data }: { data: PipelineStep[] }) {
  return (
    <Card className="h-full border-neutral-100 dark:border-neutral-800 shadow-sm transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-black uppercase tracking-tight">Répartition Pipeline</CardTitle>
        <CardDescription>Volume de prospects par étape</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: -10, right: 10 }}>
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: "bold" }}
                width={80}
              />
              <Tooltip 
                cursor={{ fill: "transparent" }} 
                contentStyle={{ borderRadius: "8px", border: "none" }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
