"use server";

import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { WorkspaceType, PlanType } from "@prisma/client";

export async function createWorkspace(formData: FormData) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Non authentifié" };
    }

    const name = formData.get("name") as string;
    const type = formData.get("type") as WorkspaceType;

    if (!name || !type) {
      return { success: false, error: "Nom et type requis" };
    }

    // Création du tenant dans Prisma
    const tenant = await prisma.tenant.create({
      data: {
        name,
        type,
        plan: "PRO", // Plan par défaut pour le démarrage
        status: "ACTIVE",
      },
    });

    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        tenantId: tenant.id,
        role: "CEO",
        workspaceType: type,
        plan: "PRO",
      },
    });
    
    return { success: true };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: err?.message || "Unknown server error" };
  }
}
