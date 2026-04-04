import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/demo(.*)",
  "/api/webhooks(.*)",
  "/api/v1/automations/check-overdue",
  "/portal/(.*)",
  "/api/v1/portal/:token",
  "/api/v1/webhooks/(.*)",
  "/api/v1/demo-request",
  "/suspended",
  "/demo-expired",
]);

const isDashboardRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/clients(.*)",
  "/pipeline(.*)",
  "/projects(.*)",
  "/planning(.*)",
  "/settings(.*)",
  "/performance(.*)",
  "/map(.*)",
  "/objectives(.*)",
  "/notifications(.*)",
  "/owners(.*)",
  "/mandates(.*)",
  "/payments(.*)",
  "/commissions(.*)",
  "/construction(.*)",
  "/availability(.*)",
  "/automations(.*)",
  "/ai(.*)",
  "/documents(.*)",
  "/cadastre(.*)",
  "/portal-manager(.*)",
  "/audit-log(.*)",
  "/portfolio(.*)",
  "/transaction-type(.*)",
]);
const isSuperAdminRoute = createRouteMatcher(["/super-admin(.*)"]);
const isApiRoute = createRouteMatcher(["/api/v1(.*)"]);
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

/**
 * Extract tenantId from Clerk session claims.
 * Clerk may expose publicMetadata at different paths depending on
 * the session token template configuration.
 */
function extractTenantId(sessionClaims: Record<string, unknown>): string | undefined {
  // Path 1: Custom session token template with {{user.public_metadata}}
  const metadata = sessionClaims?.metadata as Record<string, unknown> | undefined;
  if (metadata?.tenantId) return metadata.tenantId as string;

  // Path 2: publicMetadata directly on claims
  const pubMeta = sessionClaims?.publicMetadata as Record<string, unknown> | undefined;
  if (pubMeta?.tenantId) return pubMeta.tenantId as string;

  // Path 3: Nested under user
  const user = sessionClaims?.user as Record<string, unknown> | undefined;
  const userPubMeta = user?.publicMetadata as Record<string, unknown> | undefined;
  if (userPubMeta?.tenantId) return userPubMeta.tenantId as string;

  // Path 4: Direct on claims (some Clerk configs)
  if (sessionClaims?.tenantId) return sessionClaims.tenantId as string;

  return undefined;
}

export default clerkMiddleware(async (auth, req) => {
  // Public routes — no protection needed
  if (isPublicRoute(req)) {
    return;
  }

  // API routes — just check authentication, apiHandler does the rest
  if (isApiRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Non authentifie" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    return;
  }

  // Onboarding — must be logged in, redirect to dashboard if already has tenant
  if (isOnboardingRoute(req)) {
    await auth.protect();
    const { sessionClaims } = await auth();
    const tenantId = extractTenantId((sessionClaims || {}) as Record<string, unknown>);
    if (tenantId) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return;
  }

  // Dashboard & Super Admin routes — require auth + tenant
  if (isDashboardRoute(req) || isSuperAdminRoute(req)) {
    await auth.protect();
    const { sessionClaims } = await auth();
    const tenantId = extractTenantId((sessionClaims || {}) as Record<string, unknown>);

    // No tenant → redirect to onboarding (except super admin)
    if (!tenantId && !isSuperAdminRoute(req)) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
