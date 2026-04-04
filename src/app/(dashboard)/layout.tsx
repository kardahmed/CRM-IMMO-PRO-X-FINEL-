import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SidebarProvider } from "@/hooks/useSidebar";
import { Toaster } from "sonner";
import { DemoBanner } from "@/components/shared/demo-banner";
import { auth } from "@clerk/nextjs/server";
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
    const { userId } = await auth();
    if (!userId) return null;

    const user = await prisma.user.findFirst({
      where: { clerkId: userId, isActive: true },
      select: { tenantId: true },
    });
    if (!user) return null;

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { status: true, demoExpiresAt: true },
    });
    if (!tenant) return null;

    const isDemo = tenant.status === "DEMO";
    const isDemoExpired =
      isDemo && tenant.demoExpiresAt != null && new Date() > tenant.demoExpiresAt;

    return {
      isDemo,
      isSuspended: tenant.status === "SUSPENDED",
      isDemoExpired,
      expiresAt: tenant.demoExpiresAt?.toISOString() ?? null,
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
