import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SidebarProvider } from "@/hooks/useSidebar";
import { Toaster } from "sonner";
import { DemoBanner } from "@/components/shared/demo-banner";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

interface ITenantInfo {
  isDemo: boolean;
  isSuspended: boolean;
  isDemoExpired: boolean;
  expiresAt: string | null;
}

async function getTenantInfo(): Promise<ITenantInfo | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userId = authUser?.id;
    if (!userId) return null;

    const dbUser = await prisma.user.findFirst({
      where: { clerkId: userId, isActive: true },
      select: { tenantId: true },
    });
    if (!dbUser) return null;

    const tenant = await prisma.tenant.findUnique({
      where: { id: dbUser.tenantId },
      select: { status: true, settings: true },
    });
    if (!tenant) return null;

    const isDemo = tenant.status === "DEMO";

    // Demo expiry can be in settings JSON (always available) or dedicated column
    const settings = (typeof tenant.settings === "object" && tenant.settings !== null)
      ? (tenant.settings as Record<string, unknown>)
      : {};
    const demoExpiresAt = settings.demoExpiresAt as string | undefined;

    const isDemoExpired =
      isDemo && demoExpiresAt != null && new Date() > new Date(demoExpiresAt);

    return {
      isDemo,
      isSuspended: tenant.status === "SUSPENDED",
      isDemoExpired,
      expiresAt: demoExpiresAt ?? null,
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

  // Block access for expired demo tenants
  if (tenantInfo?.isDemoExpired) {
    redirect("/demo-expired");
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          {tenantInfo?.isDemo && (
            <DemoBanner expiresAt={tenantInfo.expiresAt} />
          )}
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
