import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const role = (user.publicMetadata?.role as UserRole) || "AGENT";

  // Simulation de données selon le rôle
  if (role === "CEO" || role === "ADMIN") {
    return NextResponse.json({
      role: "CEO",
      stats: [
        { label: "Prospects mois", value: "124", trend: "+12%", color: "blue" },
        { label: "Visites semaine", value: "42", trend: "+8%", color: "green" },
        { label: "Ventes mois", value: "12", trend: "+5%", color: "purple" },
        { label: "CA mois", value: "450k €", trend: "+15%", color: "orange" },
      ],
      conversionData: [
        { date: "01/03", value: 400 },
        { date: "05/03", value: 300 },
        { date: "10/03", value: 600 },
        { date: "15/03", value: 800 },
        { date: "20/03", value: 500 },
        { date: "25/03", value: 1100 },
        { date: "30/03", value: 1400 },
      ],
      pipelineData: [
        { name: "Prospect", value: 45 },
        { name: "Contacté", value: 32 },
        { name: "RDV", value: 18 },
        { name: "Offre", value: 12 },
        { name: "Compromis", value: 8 },
        { name: "Vente", value: 5 },
      ],
      topAgents: [
        { name: "Sophie Martin", sales: 8, revenue: "120k €", avatar: "https://i.pravatar.cc/150?u=sophie" },
        { name: "Lucas Bernard", sales: 6, revenue: "95k €", avatar: "https://i.pravatar.cc/150?u=lucas" },
        { name: "Emma Petit", sales: 5, revenue: "82k €", avatar: "https://i.pravatar.cc/150?u=emma" },
      ],
      alerts: [
        { id: 1, type: "task", title: "5 tâches en retard", severity: "high" },
        { id: 2, type: "payment", title: "3 paiements impayés", severity: "medium" },
      ],
      todayVisits: [
        { time: "10:00", property: "Villa Contemporaine - Mougins", client: "M. Dupont" },
        { time: "14:30", property: "Appartement T3 - Antibes", client: "Mme. Leroy" },
      ],
      propertyDistribution: [
        { name: "Appartements", value: 45 },
        { name: "Villas", value: 30 },
        { name: "Terrains", value: 15 },
        { name: "Commerces", value: 10 },
      ],
    });
  }

  // Dashboard AGENT
  return NextResponse.json({
    role: "AGENT",
    welcomeMessage: `Bonjour ${user.firstName || "Agent"} !`,
    stats: {
      activeClients: 24,
      monthlyGoal: 75, // 75% atteint
      todayFollowUps: 8,
    },
    todayVisits: [
      { time: "09:00", property: "Studio - Cannes", client: "Jean Valjean" },
      { time: "11:00", property: "Maison de ville - Nice", client: "Cosette" },
      { time: "16:00", property: "Penthouse - Monaco", client: "Javert" },
    ],
    tasks: [
      { id: 1, title: "Reler client Dupont", overdue: true },
      { id: 2, title: "Envoyer compromis Martin", overdue: false },
      { id: 3, title: "Préparer visite Javert", overdue: false },
    ],
  });
}
