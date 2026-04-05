"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, MoreHorizontal, Target, UserCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: number;
  title: string;
  overdue: boolean;
}

interface AgentOverviewProps {
  welcomeMessage: string;
  stats: {
    activeClients: number;
    monthlyGoal: number;
    todayFollowUps: number;
  };
  tasks: Task[];
}

export function AgentOverview({ welcomeMessage, stats, tasks }: AgentOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
          {welcomeMessage}
        </h1>
        <p className="text-muted-foreground italic">C&apos;est une excellente journée pour conclure une vente.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {/* Monthly Goal Card */}
        <Card className="col-span-1 md:col-span-2 border-primary/10 bg-primary/5 shadow-none overflow-hidden relative group">
          <div className="absolute right-0 top-0 -mr-8 -mt-8 p-12 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
          <CardHeader className="pb-2 relative">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Target className="h-5 w-5" />
              <CardTitle>Objectif du mois</CardTitle>
            </div>
            <CardDescription className="font-medium">Progression vers votre quota de ventes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2 relative">
            <div className="flex justify-between items-end">
              <span className="text-4xl font-black text-primary">{stats.monthlyGoal}%</span>
              <span className="text-sm font-medium text-muted-foreground p-1 px-2 border rounded-full bg-background/50">Progression Mensuelle</span>
            </div>
            <Progress value={stats.monthlyGoal} className="h-3 shadow-inner" />
            <div className="flex justify-between text-xs font-semibold text-muted-foreground uppercase opacity-80">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> Objectifs en cours</span>
              <span className="flex items-center gap-1"><Circle className="h-3 w-3 text-primary/30" /> Reste à accomplir</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Column */}
        <div className="grid grid-cols-1 gap-4">
           {/* Active Clients */}
          <Card className="hover:shadow-md transition-shadow border-neutral-100 dark:border-neutral-800">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clients Actifs</p>
                <p className="text-2xl font-bold">{stats.activeClients}</p>
              </div>
            </CardContent>
          </Card>
           {/* Follow Ups */}
          <Card className="hover:shadow-md transition-shadow border-neutral-100 dark:border-neutral-800">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="p-3 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Relances aujourd&apos;hui</p>
                <p className="text-2xl font-bold text-orange-600">{stats.todayFollowUps}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task List Section */}
      <Card className="border-neutral-100 dark:border-neutral-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold">Mes Tâches</CardTitle>
            <CardDescription className="text-xs">Gérez vos priorités du jour</CardDescription>
          </div>
          <Badge variant="outline" className="font-bold border-red-200 text-red-600 bg-red-50">
            <Clock className="h-3 w-3 mr-1" />
            {tasks.filter(t => t.overdue).length} Urgent
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-md hover:bg-accent/10 hover:border-accent/30 border border-transparent transition-all group">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    task.overdue ? "bg-red-500 animate-pulse" : "bg-blue-400"
                  )} />
                  <span className={cn(
                    "text-sm font-medium group-hover:text-primary transition-colors",
                    task.overdue ? "text-red-600" : "text-foreground"
                  )}>
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                   {task.overdue && <Badge variant="destructive" className="text-xs uppercase font-bold py-0 h-4">Retard</Badge>}
                   <button className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
