import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  Users, 
  CreditCard, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SuperAdminDashboard() {
  const metrics = [
    {
      title: "MRR (Revenu Récurrent)",
      value: "2 450 000 DA",
      change: "+12.5%",
      isPositive: true,
      icon: CreditCard,
      color: "text-indigo-400"
    },
    {
      title: "Workspaces Actifs",
      value: "42",
      change: "+3 ce mois",
      isPositive: true,
      icon: Building2,
      color: "text-cyan-400"
    },
    {
      title: "Utilisateurs (Agents)",
      value: "356",
      change: "+18 ce mois",
      isPositive: true,
      icon: Users,
      color: "text-emerald-400"
    },
    {
      title: "Taux d'Attrition (Churn)",
      value: "1.2%",
      change: "-0.4%",
      isPositive: true, // true because decrease in churn is good
      icon: Activity,
      color: "text-rose-400"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">IMMO PRO-X HQ</h1>
        <p className="text-neutral-400 mt-1">Vue globale de la performance du CRM SaaS.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="bg-neutral-900/50 border-neutral-800 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                {metric.title}
              </CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-white">{metric.value}</div>
              <p className="text-xs mt-1 flex items-center font-medium">
                {metric.isPositive ? (
                  <span className="text-emerald-400 flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    {metric.change}
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center">
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                    {metric.change}
                  </span>
                )}
                <span className="text-neutral-500 ml-2">vs mois précédent</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts Area */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2 bg-neutral-900/50 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Croissance des Workspaces</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-t border-neutral-800/50">
            <p className="text-neutral-500 text-sm">Zone Graphique (Recharts) - En attente d'intégration API</p>
          </CardContent>
        </Card>
        
        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Répartition par Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 border-t border-neutral-800/50">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">ENTERPRISE</Badge>
                <span className="text-white font-bold">12%</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full w-[12%]"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/10">BUSINESS</Badge>
                <span className="text-white font-bold">38%</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-1.5">
                <div className="bg-indigo-500 h-1.5 rounded-full w-[38%]"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10">PRO</Badge>
                <span className="text-white font-bold">50%</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-1.5">
                <div className="bg-cyan-500 h-1.5 rounded-full w-[50%]"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
