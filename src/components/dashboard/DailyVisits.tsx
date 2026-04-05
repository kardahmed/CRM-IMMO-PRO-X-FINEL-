"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User } from "lucide-react";


interface Visit {
  time: string;
  property: string;
  client: string;
}

export function DailyVisits({ visits }: { visits: Visit[] }) {
  return (
    <Card className="h-full border-neutral-100 dark:border-neutral-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-bold">Visites du jour</CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {visits.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-4">Pas de visites programmées pour aujourd&apos;hui</p>
          ) : (
            visits.map((visit, i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-lg border bg-accent/10 hover:bg-accent/20 transition-colors group">
                <div className="flex flex-col items-center justify-center min-w-[60px] h-12 bg-primary/10 rounded text-primary font-bold">
                  <Clock className="h-3 w-3 mb-1" />
                  <span className="text-sm">{visit.time}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-sm font-semibold truncate group-hover:text-primary transition-colors">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {visit.property}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <User className="h-3 w-3 shrink-0" />
                    {visit.client}
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20 bg-primary/5">Confirmé</Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
