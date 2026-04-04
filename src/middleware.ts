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

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return;
  }

  if (isApiRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Non authentifié" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    return;
  }

  // Protect onboarding route too (must be logged in)
  if (isOnboardingRoute(req)) {
    await auth.protect();
    // If they already have a tenant, redirect to dashboard
    const { sessionClaims } = await auth();
    const claims = sessionClaims as Record<string, any>;
    const tenantId = claims?.metadata?.tenantId || claims?.publicMetadata?.tenantId;
    if (tenantId) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return;
  }

  if (isDashboardRoute(req) || isSuperAdminRoute(req)) {
    await auth.protect();
    const { sessionClaims } = await auth();
    const claims = sessionClaims as Record<string, any>;
    
    // Supabase / Clerk usually puts publicMetadata inside sessionClaims.publicMetadata or sessionClaims.metadata depending on template
    const tenantId = claims?.metadata?.tenantId || claims?.publicMetadata?.tenantId;
    
    // Redirect to onboarding if no tenant is set
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
