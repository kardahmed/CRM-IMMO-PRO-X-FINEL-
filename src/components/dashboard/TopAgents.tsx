"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star } from "lucide-react";

interface Agent {
  name: string;
  sales: number;
  avatar: string;
}

const rankIcons = [
  <Trophy key="trophy" className="h-5 w-5 text-yellow-500" />,
  <Medal key="medal" className="h-5 w-5 text-slate-400" />,
  <Star key="star" className="h-5 w-5 text-amber-600" />,
];

export function TopAgents({ agents }: { agents: Agent[] }) {
  return (
    <Card className="h-full border-border shadow-sm transition-all hover:shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-bold uppercase tracking-tight">Top Performance</CardTitle>
        <CardDescription>Les meilleurs agents par volume de transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {agents.map((agent, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border bg-white/50 dark:bg-black/20 hover:border-primary/20 hover:bg-white dark:hover:bg-black/40 transition-all group">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-transparent group-hover:border-primary/30 transition-all">
                    <AvatarImage src={agent.avatar} />
                    <AvatarFallback>{agent.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-1 -right-1">
                    {rankIcons[i]}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold truncate max-w-[120px]">{agent.name}</p>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">{agent.sales} Transactions</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="text-xs font-bold border-primary/20 text-primary bg-primary/5 uppercase">
                  Rang #{i + 1}
                </Badge>
              </div>
            </div>
          ))}

          {agents.length === 0 && (
            <div className="text-center py-8 opacity-20 grayscale">
              <Trophy className="h-12 w-12 mx-auto mb-2" />
              <p className="text-xs font-bold uppercase tracking-widest">Aucune donnée</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
