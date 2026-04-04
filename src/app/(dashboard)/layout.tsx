import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SidebarProvider } from "@/hooks/useSidebar";
import { Toaster } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
