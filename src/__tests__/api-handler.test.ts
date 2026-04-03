import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { z } from "zod";

// ============================================================================
// Mocks
// ============================================================================

const mockGetCurrentUser = vi.fn();

vi.mock("@/lib/auth", () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}));

vi.mock("@/lib/prisma-tenant", () => ({
  createTenantPrisma: vi.fn().mockReturnValue({ client: {}, task: {} }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { $extends: vi.fn() },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

// ============================================================================
// Imports
// ============================================================================

import { apiHandler, jsonOk, jsonError } from "@/lib/api-handler";

// ============================================================================
// Helpers
// ============================================================================

function createRequest(method: string, body?: unknown): NextRequest {
  const url = "http://localhost:3000/api/v1/test";
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new NextRequest(url, init);
}

async function extractJson(response: Response): Promise<Record<string, unknown>> {
  return response.json() as Promise<Record<string, unknown>>;
}

// ============================================================================
// Tests
// ============================================================================

describe("apiHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication", () => {
    it("retourne 401 si non authentifie", async () => {
      mockGetCurrentUser.mockRejectedValue(new Error("Not authenticated"));

      const handler = apiHandler({}, async () => jsonOk({ test: true }));
      const res = await handler(createRequest("GET"));
      const body = await extractJson(res);

      expect(res.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error).toContain("Non authentifié");
    });

    it("retourne 403 si pas de tenantId", async () => {
      mockGetCurrentUser.mockResolvedValue({
        userId: "user-1",
        tenantId: null,
        role: "AGENT",
      });

      const handler = apiHandler({}, async () => jsonOk({ test: true }));
      const res = await handler(createRequest("GET"));
      const body = await extractJson(res);

      expect(res.status).toBe(403);
      expect(body.error).toContain("tenant");
    });
  });

  describe("Permissions", () => {
    it("retourne 403 si permission refusee", async () => {
      mockGetCurrentUser.mockResolvedValue({
        userId: "user-1",
        tenantId: "tenant-1",
        role: "ASSISTANT", // ASSISTANT ne peut pas DELETE
        dbUserId: "db-user-1",
      });

      const handler = apiHandler(
        { module: "CLIENTS", action: "DELETE" },
        async () => jsonOk({}),
      );
      const res = await handler(createRequest("GET"));
      const body = await extractJson(res);

      expect(res.status).toBe(403);
      expect(body.error).toContain("Permission refusée");
    });

    it("autorise le CEO sur toute action", async () => {
      mockGetCurrentUser.mockResolvedValue({
        userId: "user-1",
        tenantId: "tenant-1",
        role: "CEO",
        dbUserId: "db-user-1",
      });

      const handler = apiHandler(
        { module: "CLIENTS", action: "DELETE" },
        async () => jsonOk({ deleted: true }),
      );
      const res = await handler(createRequest("GET"));
      const body = await extractJson(res);

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("autorise un AGENT en lecture", async () => {
      mockGetCurrentUser.mockResolvedValue({
        userId: "user-1",
        tenantId: "tenant-1",
        role: "AGENT",
        dbUserId: "db-user-1",
      });

      const handler = apiHandler(
        { module: "CLIENTS", action: "READ" },
        async () => jsonOk({ clients: [] }),
      );
      const res = await handler(createRequest("GET"));
      const body = await extractJson(res);

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("bloque un AGENT sur ASSIGN", async () => {
      mockGetCurrentUser.mockResolvedValue({
        userId: "user-1",
        tenantId: "tenant-1",
        role: "AGENT",
        dbUserId: "db-user-1",
      });

      const handler = apiHandler(
        { module: "CLIENTS", action: "ASSIGN" },
        async () => jsonOk({}),
      );
      const res = await handler(createRequest("GET"));

      expect(res.status).toBe(403);
    });
  });

  describe("Zod Validation", () => {
    const testSchema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
    });

    it("valide le body POST avec Zod", async () => {
      mockGetCurrentUser.mockResolvedValue({
        userId: "user-1",
        tenantId: "tenant-1",
        role: "CEO",
        dbUserId: "db-user-1",
      });

      const handler = apiHandler(
        { module: "CLIENTS", action: "CREATE", schema: testSchema },
        async (ctx) => {
          const body = (ctx.req as NextRequest & { validatedBody: unknown }).validatedBody;
          return jsonOk(body);
        },
      );

      const res = await handler(
        createRequest("POST", { name: "Ahmed", email: "ahmed@test.com" }),
      );
      const body = await extractJson(res);

      expect(res.status).toBe(200);
      expect(body.data).toEqual({ name: "Ahmed", email: "ahmed@test.com" });
    });

    it("retourne 422 si body invalide", async () => {
      mockGetCurrentUser.mockResolvedValue({
        userId: "user-1",
        tenantId: "tenant-1",
        role: "CEO",
        dbUserId: "db-user-1",
      });

      const handler = apiHandler(
        { module: "CLIENTS", action: "CREATE", schema: testSchema },
        async () => jsonOk({}),
      );

      const res = await handler(
        createRequest("POST", { name: "A", email: "not-an-email" }),
      );
      const body = await extractJson(res);

      expect(res.status).toBe(422);
      expect(body.success).toBe(false);
    });

    it("retourne 400 si body absent sur POST", async () => {
      mockGetCurrentUser.mockResolvedValue({
        userId: "user-1",
        tenantId: "tenant-1",
        role: "CEO",
        dbUserId: "db-user-1",
      });

      const handler = apiHandler(
        { module: "CLIENTS", action: "CREATE", schema: testSchema },
        async () => jsonOk({}),
      );

      // POST without body
      const req = new NextRequest("http://localhost:3000/api/v1/test", {
        method: "POST",
      });
      const res = await handler(req);

      expect(res.status).toBe(400);
    });

    it("ne valide pas le body pour les GET", async () => {
      mockGetCurrentUser.mockResolvedValue({
        userId: "user-1",
        tenantId: "tenant-1",
        role: "CEO",
        dbUserId: "db-user-1",
      });

      const handler = apiHandler(
        { module: "CLIENTS", action: "READ", schema: testSchema },
        async () => jsonOk({ ok: true }),
      );

      const res = await handler(createRequest("GET"));

      expect(res.status).toBe(200);
    });
  });

  describe("Error handling", () => {
    it("capture les erreurs du handler et retourne 500", async () => {
      mockGetCurrentUser.mockResolvedValue({
        userId: "user-1",
        tenantId: "tenant-1",
        role: "CEO",
        dbUserId: "db-user-1",
      });

      const handler = apiHandler({}, async () => {
        throw new Error("Database connection failed");
      });

      const res = await handler(createRequest("GET"));
      const body = await extractJson(res);

      expect(res.status).toBe(500);
      expect(body.error).toBe("Database connection failed");
    });
  });

  describe("jsonOk / jsonError helpers", () => {
    it("jsonOk retourne success: true + data", async () => {
      const res = jsonOk({ items: [1, 2, 3] });
      const body = await extractJson(res);

      expect(body).toEqual({ success: true, data: { items: [1, 2, 3] } });
    });

    it("jsonError retourne success: false + error", async () => {
      const res = jsonError("Not found", 404);
      const body = await extractJson(res);

      expect(res.status).toBe(404);
      expect(body).toEqual({ success: false, error: "Not found" });
    });
  });
});
