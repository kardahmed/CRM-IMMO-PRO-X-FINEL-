import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Users, 
  CreditCard, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Globe,
  Zap,
  ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function SuperAdminDashboard() {
  const metrics = [
    {
      title: "MRR (Revenu Récurrent)",
      value: "2 450 000 DA",
      change: "+12.5%",
      isPositive: true,
      icon: CreditCard,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20"
    },
    {
      title: "Workspaces PRO-X",
      value: "42",
      change: "+3 ce mois",
      isPositive: true,
      icon: Building2,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20"
    },
    {
      title: "Utilisateurs Actifs",
      value: "356",
      change: "+18 ce mois",
      isPositive: true,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    },
    {
      title: "Taux de Churn",
      value: "1.2%",
      change: "-0.4%",
      isPositive: true, 
      icon: Activity,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20"
    }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 slide-in-from-bottom-4 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/50">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
            <Zap className="h-3.5 w-3.5" /> HQ Control Panel
          </div>
          <h1 className="text-6xl font-black text-foreground tracking-tighter italic uppercase underline decoration-primary/30 decoration-8 underline-offset-8">Performance</h1>
        </div>
        <div className="flex items-center gap-4 text-right bg-card p-4 rounded-3xl border border-border shadow-sm">
           <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-emerald-500" />
           </div>
           <div className="pr-2">
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em]">Dernière Sync</p>
             <p className="text-sm font-black text-foreground">Flux Temps Réel</p>
           </div>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="bg-card border-border shadow-stripe hover:shadow-stripe-lg hover:-translate-y-1 transition-all duration-500 rounded-[32px] group overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-6">
              <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60">
                {metric.title}
              </CardTitle>
              <div className={cn("p-3 rounded-2xl border transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm", metric.bg, metric.border, metric.color)}>
                <metric.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground tracking-tighter tabular-nums">{metric.value}</div>
              <p className="text-[10px] mt-4 flex items-center font-black uppercase tracking-[0.1em]">
                {metric.isPositive ? (
                  <span className="text-emerald-600 flex items-center bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                    {metric.change}
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                    <ArrowDownRight className="h-3.5 w-3.5 mr-1.5" />
                    {metric.change}
                  </span>
                )}
                <span className="text-muted-foreground/40 ml-3 font-bold tracking-widest">CROISSANCE</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2 bg-card border-border shadow-stripe-lg rounded-[40px] overflow-hidden flex flex-col">
          <CardHeader className="p-8 border-b border-border/50 bg-accent/30 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-black text-foreground italic uppercase tracking-tighter">Monétisation & Workspaces</CardTitle>
                <div className="flex items-center gap-3">
                  <Badge className="bg-primary/20 text-primary border-none text-[9px] font-black px-3">Live Feed</Badge>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Volume analytique global</p>
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-background border border-border shadow-sm flex items-center justify-center">
                <Globe className="h-6 w-6 text-primary/40 animate-pulse" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-[400px] flex items-center justify-center relative bg-background/50">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_hsl(var(--primary))_0.5px,_transparent_0.5px)] [background-size:32px_32px] opacity-[0.03]" />
            <div className="text-center space-y-6 z-10 p-10">
               <div className="h-24 w-24 rounded-[32px] bg-background border-2 border-border shadow-stripe flex items-center justify-center mx-auto mb-8 relative group">
                  <div className="absolute inset-0 bg-primary/5 rounded-[32px] animate-ping" />
                  <Activity className="h-10 w-10 text-primary/30 relative z-10" />
               </div>
               <div>
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.5em] mb-3">Recharts Engine v2.10.3</p>
                 <p className="text-sm font-black text-foreground max-w-sm mx-auto leading-relaxed uppercase tracking-tighter">
                   En attente de connexion sécurisée au flux API Phoenix pour la visualisation des données réelles
                 </p>
               </div>
               <Button variant="outline" className="rounded-full px-8 font-black text-[10px] uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5">
                 Configurer le Webhook
               </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-foreground text-background border-none shadow-stripe-lg rounded-[40px] p-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] group-hover:bg-primary/30 transition-all duration-1000" />
          <CardHeader className="p-10">
            <CardTitle className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-4 text-background">
              Plans
              <ShieldCheck className="h-7 w-7 text-primary" />
            </CardTitle>
            <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.4em] mt-2">Distribution du CA</p>
          </CardHeader>
          <CardContent className="space-y-10 p-10 pt-0 relative z-10">
            {[
              { label: "ENTERPRISE", value: 12, color: "bg-emerald-400" },
              { label: "BUSINESS", value: 38, color: "bg-primary" },
              { label: "ESSENTIAL", value: 50, color: "bg-background shadow-lg" },
            ].map((plan, i) => (
              <div key={i} className="space-y-4">
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.3em]">{plan.label}</span>
                    <div className="h-1 w-8 bg-primary/20 rounded-full" />
                  </div>
                  <span className="text-4xl font-black tabular-nums tracking-tighter text-background">{plan.value}%</span>
                </div>
                <div className="h-3 w-full bg-background/5 rounded-full overflow-hidden p-0.5 border border-background/10">
                  <div className={cn("h-full rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(var(--primary),0.3)]", plan.color)} style={{ width: `${plan.value}%` }}></div>
                </div>
              </div>
            ))}
            
            <div className="mt-12 pt-8 border-t border-background/5 text-center">
               <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] animate-pulse">Infrastructure Active</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
