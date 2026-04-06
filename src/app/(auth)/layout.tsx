export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 relative overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-900">
      {/* Premium Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse duration-[10s]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-200/20 rounded-full blur-[140px] pointer-events-none animate-pulse duration-[8s]" />
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />

      <div className="relative z-10 w-full flex justify-center py-10">
        {children}
      </div>
    </div>
  );
}
