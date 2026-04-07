import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SidebarProvider } from "@/hooks/useSidebar";
import { Toaster } from "sonner";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

interface ITenantInfo {
  isSuspended: boolean;
}

async function getTenantInfo(): Promise<ITenantInfo | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userId = authUser?.id;
    if (!userId) return null;

    const dbUser = await prisma.user.findFirst({
      where: { supabaseId: userId, isActive: true },
      select: { tenantId: true },
    });
    const tenantIdToFetch = dbUser?.tenantId ?? null;

    if (!tenantIdToFetch) return null;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantIdToFetch },
      select: { status: true, settings: true },
    });
    if (!tenant) return null;

    return {
      isSuspended: tenant.status === "SUSPENDED",
    };
  } catch {
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenantInfo = await getTenantInfo();

  // Block access for suspended tenants
  if (tenantInfo?.isSuspended) {
    redirect("/suspended");
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto bg-accent/5 p-3 md:p-6 lg:p-8">
            <div className="w-full h-full animate-page-enter">{children}</div>
          </main>
        </div>
      </div>
      <Toaster richColors position="top-right" toastOptions={{ className: "font-sans" }} />
    </SidebarProvider>
  );
}
