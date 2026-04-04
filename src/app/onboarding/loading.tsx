export default function OnboardingLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl animate-pulse space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10" />
            <div className="h-8 w-48 bg-white/10 rounded-lg" />
            <div className="h-4 w-64 bg-white/5 rounded" />
          </div>
          <div className="space-y-4">
            <div className="h-4 w-32 bg-white/10 rounded" />
            <div className="h-12 w-full bg-white/5 rounded-xl" />
            <div className="h-4 w-32 bg-white/10 rounded" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 bg-white/5 rounded-xl" />
              <div className="h-20 bg-white/5 rounded-xl" />
            </div>
          </div>
          <div className="h-12 w-full bg-white/10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
