import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/v1/automations/check-overdue",
  "/portal(.*)",
  "/api/v1/portal(.*)",
]);

const isDashboardRoute = createRouteMatcher(["/(dashboard)(.*)"]);
const isApiRoute = createRouteMatcher(["/api/v1(.*)"]);

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

  if (isDashboardRoute(req)) {
    await auth.protect();
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
