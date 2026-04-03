"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star } from "lucide-react";

interface Agent {
  name: string;
  sales: number;
  revenue: string;
  avatar: string;
}

const rankIcons = [
  <Trophy className="h-5 w-5 text-yellow-500" />,
  <Medal className="h-5 w-5 text-slate-400" />,
  <Star className="h-5 w-5 text-amber-600" />,
];

export function TopAgents({ agents }: { agents: Agent[] }) {
  return (
    <Card className="h-full border-neutral-100 dark:border-neutral-800 shadow-sm transition-all hover:shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-black uppercase tracking-tight">Top Performance</CardTitle>
        <CardDescription>Les 3 meilleurs agents ce mois-ci</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {agents.map((agent, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-neutral-50 bg-white/50 dark:bg-black/20 hover:border-primary/20 hover:bg-white dark:hover:bg-black/40 transition-all group">
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
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">{agent.sales} Ventes</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="text-[10px] font-black border-primary/20 text-primary bg-primary/5 uppercase">
                  {agent.revenue} CA
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
