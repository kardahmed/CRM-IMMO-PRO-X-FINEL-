"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { resolve } from "path";
import { seedDemoData } from "@/lib/demo-seeding";
import { revalidatePath } from "next/cache";

/**
 * Action pour injecter des données de démo dans le workspace actuel.
 * Réservé aux Super Admins.
 */
export async function triggerDemoSeeding(tenantId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== "contact@sensium-x.com") {
    throw new Error("Accès non autorisé : seul le Super Admin peut injecter des données de démo.");
  }

  try {
    const result = await seedDemoData(tenantId, user.id);
    
    // Revalider les chemins principaux pour voir les données
    revalidatePath("/dashboard");
    revalidatePath("/projects");
    revalidatePath("/pipeline");
    revalidatePath("/clients");
    revalidatePath("/portfolio");

    return { 
      success: true, 
      message: `Injection réussie : ${result.projectCount} projet, ${result.propertyCount} biens et ${result.clientCount} clients créés.` 
    };
  } catch (error: any) {
    console.error("Erreur Seeding Demo:", error);
    return { success: false, error: error.message };
  }
}
