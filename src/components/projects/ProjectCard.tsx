import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, Eye } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  id: string;
  name: string;
  location: string;
  availableUnits: number;
  totalUnits: number;
  progress: number;
  status: string;
  imageUrl: string;
  code?: string;
  avgPrice?: string;
  deliveryDate?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PLANNING: { label: "Planification", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  IN_PROGRESS: { label: "Active", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  DELIVERED: { label: "Livre", color: "bg-muted text-muted-foreground" },
  CANCELLED: { label: "Annule", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
};

export function ProjectCard({ id, name, location, availableUnits, totalUnits, progress, status, imageUrl, code = "prj-001", avgPrice = "~5.7 M DA/unite", deliveryDate = "juin 2026" }: ProjectCardProps) {
  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.IN_PROGRESS;
  const soldUnits = totalUnits - availableUnits;
  const sellRatio = totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0;

  return (
    <Card className="overflow-hidden border-border shadow-stripe hover:shadow-stripe-lg hover:-translate-y-1 transition-all duration-500 group rounded-[24px]">
      {/* Cover */}
      <div className="relative h-40 w-full overflow-hidden">
        <Image src={imageUrl} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" fill sizes="(max-width: 768px) 100vw, 400px" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute top-3 left-3">
          <Badge className={cn("text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border-none", sc.color)}>
            {sc.label}
          </Badge>
        </div>

        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="text-sm font-black leading-tight">{name}</h3>
          <p className="text-[10px] opacity-80 font-bold uppercase tracking-wider">Code: {code}</p>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Meta Info */}
        <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase">
          <div className="flex items-center gap-1">
             <MapPin className="h-3 w-3 text-primary" /> {location}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            {deliveryDate}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="space-y-2">
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Unites</p>
           <div className="grid grid-cols-3 gap-2">
              <div className="bg-accent/50 p-2 rounded-xl border border-border text-center">
                 <p className="text-emerald-600 font-black text-xs">{soldUnits}</p>
                 <p className="text-[8px] text-muted-foreground font-black uppercase">Vendues</p>
              </div>
              <div className="bg-accent/50 p-2 rounded-xl border border-border text-center">
                 <p className="font-black text-xs text-foreground">{availableUnits}</p>
                 <p className="text-[8px] text-muted-foreground font-black uppercase">Dispo</p>
              </div>
              <div className="bg-accent/50 p-2 rounded-xl border border-border text-center">
                 <p className="font-black text-xs text-foreground">{totalUnits}</p>
                 <p className="text-[8px] text-muted-foreground font-black uppercase">Total</p>
              </div>
           </div>
        </div>

        {/* Progress */}
        <div className="space-y-1">
           <div className="flex justify-between items-center text-[10px] font-black uppercase">
              <span className="text-emerald-600">{sellRatio}% vendues</span>
           </div>
           <Progress value={sellRatio} className="h-1.5 bg-accent" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
           <Link href={`/projects/${id}`} className="flex-1">
              <Button variant="outline" className="w-full text-[10px] font-black uppercase h-9 border-border rounded-xl gap-1.5 hover:bg-accent/50 transition-all">
                 <Eye className="h-3 w-3" /> Details
              </Button>
           </Link>
           <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-black uppercase h-9 shadow-stripe rounded-xl gap-1.5">
              Unites <ArrowRight className="h-3 w-3" />
           </Button>
        </div>
      </CardContent>
    </Card>
  );
}
