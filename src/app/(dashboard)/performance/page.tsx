"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Download, Users, TrendingUp, DollarSign, Home, PhoneCall, Clock } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

// MOCKS
const KPI_GLOBALS = [
  { title: "Visites Réalisées", value: "245", trend: "+12%", icon: Home },
  { title: "Ventes Clôturées", value: "32", trend: "+5%", icon: TrendingUp },
  { title: "Taux de Conversion", value: "13.06%", trend: "-1.2%", icon: Users },
  { title: "CA Généré (DA)", value: "850M", trend: "+18%", icon: DollarSign },
];

const TREND_DATA = [
  { name: "01 Avr", visites: 12, ventes: 1 },
  { name: "05 Avr", visites: 19, ventes: 2 },
  { name: "10 Avr", visites: 15, ventes: 1 },
  { name: "15 Avr", visites: 25, ventes: 4 },
  { name: "20 Avr", visites: 22, ventes: 3 },
  { name: "25 Avr", visites: 30, ventes: 5 },
  { name: "30 Avr", visites: 28, ventes: 4 },
];

const FUNNEL_DATA = [
  { name: "Visite programmée", value: 300, fill: "#3b82f6" },
  { name: "Visite terminée", value: 245, fill: "#8b5cf6" },
  { name: "Négociation", value: 85, fill: "#f59e0b" },
  { name: "Réservation", value: 40, fill: "#ef4444" },
  { name: "Vente", value: 32, fill: "#10b981" },
];

const AGENT_KPIS = [
  { name: "Karim Benmohamed", role: "Senior", visites: 45, ventes: 8, conversion: "17%", time: "14 jours", interactions: 120 },
  { name: "Amira Hadj", role: "Agent", visites: 38, ventes: 5, conversion: "13%", time: "18 jours", interactions: 95 },
  { name: "Lucas Bernard", role: "Junior", visites: 25, ventes: 2, conversion: "8%", time: "22 jours", interactions: 150 },
  { name: "Sophie Martin", role: "Senior", visites: 42, ventes: 7, conversion: "16%", time: "12 jours", interactions: 110 },
];

export default function PerformancePage() {
  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Performance & Analytics</h1>
            <p className="text-sm text-muted-foreground font-medium">Vue globale sur les KPIs de l'agence</p>
          </div>
        </div>

        <Button variant="outline" className="gap-2 font-bold bg-white dark:bg-black">
          <Download className="h-4 w-4" /> Générer Rapport PDF
        </Button>
      </div>

      {/* 4 KPIs Globaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_GLOBALS.map((kpi, i) => {
          const isUp = kpi.trend.startsWith("+");
          return (
            <Card key={i} className="shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase text-muted-foreground mb-1">{kpi.title}</p>
                  <p className="text-2xl font-black">{kpi.value}</p>
                  <Badge variant="outline" className={`mt-2 text-[10px] font-bold ${isUp ? 'text-green-600 border-green-200 bg-green-50' : 'text-red-600 border-red-200 bg-red-50'}`}>
                    {kpi.trend} vs mois précédent
                  </Badge>
                </div>
                <div className={`p-3 rounded-full ${i === 0 ? 'bg-primary/10 text-primary' : i === 1 ? 'bg-green-100 text-green-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'}`}>
                  <kpi.icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart Trends */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-black">Tendance Visites vs Ventes (30 jours)</CardTitle>
            <CardDescription>Évolution des performances sur le mois en cours</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisites" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="visites" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVisites)" />
                <Area type="monotone" dataKey="ventes" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVentes)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Funnel Chart Pipeline */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-black">Entonnoir de Conversion</CardTitle>
            <CardDescription>Déperdition des leads à chaque étape du pipeline</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={FUNNEL_DATA}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold' }} width={100} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {FUNNEL_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Agents Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-black">Performance par Agent</CardTitle>
          <CardDescription>KPIs détaillés par membre de l'équipe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-accent/50 text-muted-foreground border-b rounded-t-xl">
                <tr>
                  <th className="px-4 py-3 font-bold rounded-tl-xl text-foreground">Agent</th>
                  <th className="px-4 py-3 font-bold text-center"><Home className="inline w-3.5 h-3.5 mr-1"/>Visites</th>
                  <th className="px-4 py-3 font-bold text-center"><TrendingUp className="inline w-3.5 h-3.5 mr-1"/>Ventes</th>
                  <th className="px-4 py-3 font-bold text-center">Taux Conv.</th>
                  <th className="px-4 py-3 font-bold text-center"><Clock className="inline w-3.5 h-3.5 mr-1"/>Délai Moyen</th>
                  <th className="px-4 py-3 font-bold text-center rounded-tr-xl"><PhoneCall className="inline w-3.5 h-3.5 mr-1"/>Interactions</th>
                </tr>
              </thead>
              <tbody>
                {AGENT_KPIS.map((agent, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold">{agent.name}</p>
                      <p className="text-[10px] uppercase font-black text-muted-foreground">{agent.role}</p>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{agent.visites}</td>
                    <td className="px-4 py-3 text-center font-bold text-primary">{agent.ventes}</td>
                    <td className="px-4 py-3 text-center text-xs font-black">
                      <Badge variant="outline" className={parseInt(agent.conversion) > 15 ? 'bg-green-50 text-green-700 border-green-200' : ''}>{agent.conversion}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{agent.time}</td>
                    <td className="px-4 py-3 text-center font-mono">{agent.interactions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
