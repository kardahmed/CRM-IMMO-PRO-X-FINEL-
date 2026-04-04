import { Toaster } from "sonner";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* No AuthHeader here — clean onboarding experience */}
      {children}
      <Toaster richColors position="top-center" />
    </>
  );
}
