import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      color: "text-emerald-600",
      bg: "bg-emerald-500/5",
      border: "border-emerald-500/10"
    },
    {
      title: "Workspaces PRO-X",
      value: "42",
      change: "+3 ce mois",
      isPositive: true,
      icon: Building2,
      color: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/10"
    },
    {
      title: "Utilisateurs Actifs",
      value: "356",
      change: "+18 ce mois",
      isPositive: true,
      icon: Users,
      color: "text-emerald-700",
      bg: "bg-emerald-700/5",
      border: "border-emerald-700/10"
    },
    {
      title: "Taux de Churn",
      value: "1.2%",
      change: "-0.4%",
      isPositive: true, // true because decrease in churn is good
      icon: Activity,
      color: "text-neutral-900",
      bg: "bg-neutral-500/5",
      border: "border-neutral-500/10"
    }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 slide-in-from-bottom-4">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-border/50">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-2">
            <Zap className="h-3 w-3" /> HQ Control Panel
          </div>
          <h1 className="text-5xl font-black text-foreground tracking-tighter italic uppercase underline decoration-primary decoration-8 underline-offset-8 text-nowrap">Performance</h1>
        </div>
        <div className="flex items-center gap-4 text-right">
           <div>
             <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.25em]">Dernière Sync</p>
             <p className="text-sm font-bold text-foreground">À l&apos;instant</p>
           </div>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="bg-card border-border shadow-stripe hover:shadow-stripe-lg hover:-translate-y-1 transition-all duration-500 rounded-[28px] group">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">
                {metric.title}
              </CardTitle>
              <div className={cn("p-2.5 rounded-xl border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3", metric.bg, metric.border, metric.color)}>
                <metric.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground tracking-tighter tabular-nums">{metric.value}</div>
              <p className="text-xs mt-2 flex items-center font-bold uppercase tracking-widest">
                {metric.isPositive ? (
                  <span className="text-emerald-500 flex items-center bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <TrendingUp className="h-3.5 w-3.5 mr-1" />
                    {metric.change}
                  </span>
                ) : (
                  <span className="text-rose-500 flex items-center bg-rose-500/10 px-2 py-0.5 rounded-full">
                    <ArrowDownRight className="h-3.5 w-3.5 mr-1" />
                    {metric.change}
                  </span>
                )}
                <span className="text-muted-foreground/40 ml-3 font-bold">Croissance</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2 bg-card border-border shadow-stripe-lg rounded-[32px] overflow-hidden">
          <CardHeader className="p-8 border-b border-border/50 bg-accent/50">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-black text-foreground italic uppercase">Monétisation & Workspaces</CardTitle>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Volume analytique global</p>
              </div>
              <Globe className="h-5 w-5 text-primary/30" />
            </div>
          </CardHeader>
          <CardContent className="h-[400px] flex items-center justify-center relative bg-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_1%)] [background-size:24px_24px] opacity-10" />
            <div className="text-center space-y-4 z-10">
               <div className="h-16 w-16 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-6">
                 <Activity className="h-8 w-8 text-primary/40 animate-pulse" />
               </div>
               <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.4em]">Visualisation Recharts v2.0</p>
               <p className="text-xs font-bold text-neutral-900">En attente de connexion au flux API Phoenix</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-neutral-900 text-white border-none shadow-stripe-lg rounded-[32px] p-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[80px] group-hover:bg-primary/30 transition-all duration-1000" />
          <CardHeader className="p-8">
            <CardTitle className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
              Distribution Plans
              <ShieldCheck className="h-5 w-5 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 p-8 relative z-10">
            {[
              { label: "ENTERPRISE", value: 12, color: "bg-emerald-400" },
              { label: "BUSINESS", value: 38, color: "bg-primary" },
              { label: "ESSENTIAL", value: 50, color: "bg-white" },
            ].map((plan, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.25em]">{plan.label}</span>
                  <span className="text-xl font-black tabular-nums">{plan.value}%</span>
                </div>
                <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div className={cn("h-full rounded-full transition-all duration-1000", plan.color)} style={{ width: `${plan.value}%` }}></div>
                </div>
              </div>
            ))}
            
            <div className="mt-8 pt-8 border-t border-white/5 text-center">
               <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] animate-pulse">Tous les serveurs sont opérationnels</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
