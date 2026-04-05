import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = new Set([
  "/",
  "/sign-in",
  "/sign-up",
  "/suspended",
  "/demo-expired",
]);

const PUBLIC_PREFIXES = [
  "/api/webhooks",
  "/api/v1/webhooks",
  "/api/v1/demo-request",
  "/api/v1/automations/check-overdue",
  "/api/v1/automations/check-pending",
  "/portal/",
  "/api/v1/portal/",
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

function isDashboardRoute(pathname: string): boolean {
  const dashboardPrefixes = [
    "/dashboard", "/clients", "/pipeline", "/projects", "/planning",
    "/settings", "/performance", "/map", "/objectives", "/notifications",
    "/owners", "/mandates", "/payments", "/commissions", "/construction",
    "/availability", "/automations", "/ai", "/documents", "/cadastre",
    "/portal-manager", "/audit-log", "/portfolio", "/transaction-type",
  ];
  return dashboardPrefixes.some((p) => pathname.startsWith(p));
}

function isSuperAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/super-admin");
}

function isOnboardingRoute(pathname: string): boolean {
  return pathname.startsWith("/onboarding");
}

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Do NOT use getSession() — use getUser() for security
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = req.nextUrl.pathname;

  // Public routes — always allow
  if (isPublicRoute(pathname)) {
    return supabaseResponse;
  }

  // API routes — return 401 JSON if not authenticated
  if (isApiRoute(pathname)) {
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Non authentifie" },
        { status: 401 },
      );
    }
    return supabaseResponse;
  }

  // Not authenticated — redirect to sign-in
  if (!user) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_to", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Onboarding — redirect to dashboard if user already has a tenant
  // (We check user_metadata for tenantId set during workspace creation)
  if (isOnboardingRoute(pathname)) {
    const tenantId = user.user_metadata?.tenantId as string | undefined;
    if (tenantId) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return supabaseResponse;
  }

  // Dashboard & Super Admin — require tenant (except super admin)
  if (isDashboardRoute(pathname) || isSuperAdminRoute(pathname)) {
    const tenantId = user.user_metadata?.tenantId as string | undefined;
    if (!tenantId && !isSuperAdminRoute(pathname)) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
