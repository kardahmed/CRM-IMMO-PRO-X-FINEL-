import { z } from "zod";
import { createTenantPrisma } from "@/lib/prisma-tenant";
import { checkDuplicates, normalizePhone } from "@/services/client-dedup";

// ============================================================================
// Types
// ============================================================================

export interface IImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

interface IClientRow {
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  source: string;
  pipelineStage: string;
  budgetMin: number | null;
  budgetMax: number | null;
}

interface IPropertyRow {
  name: string;
  type: string;
  status: string;
  price: number | null;
  surface: number | null;
  rooms: number | null;
  floor: number | null;
  transactionType: string;
  projectName: string | null;
}

// ============================================================================
// CSV Helpers
// ============================================================================

/**
 * Escape a value for CSV output. Wraps in quotes if the value contains
 * commas, quotes, or newlines. Inner quotes are doubled.
 */
function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Parse a single CSV line respecting quoted fields.
 * Handles: commas inside quotes, escaped double-quotes ("").
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        // Check for escaped quote ""
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }

  fields.push(current.trim());
  return fields;
}

/**
 * Parse full CSV content into an array of string arrays.
 * First row is treated as headers.
 */
function parseCsvContent(csv: string): { headers: string[]; rows: string[][] } {
  const lines = csv
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim() !== "");

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(parseCsvLine);

  return { headers, rows };
}

// ============================================================================
// Zod Schemas for Import Validation
// ============================================================================

const VALID_SOURCES = ["FACEBOOK", "WEBSITE", "REFERRAL", "WALK_IN", "PHONE", "OTHER"] as const;
const VALID_PIPELINE_STAGES = [
  "NEW", "CONTACTED", "QUALIFIED", "VISIT_SCHEDULED", "VISITED",
  "NEGOTIATION", "RESERVED", "SIGNED", "CLOSED",
] as const;
const VALID_PROPERTY_TYPES = [
  "APARTMENT", "STUDIO", "DUPLEX", "PENTHOUSE", "VILLA",
  "COMMERCIAL", "PARKING", "CAVE", "TERRAIN",
] as const;
const VALID_PROPERTY_STATUSES = ["AVAILABLE", "RESERVED", "SOLD", "RENTED", "BLOCKED"] as const;
const VALID_TRANSACTION_TYPES = ["SALE", "RENT"] as const;

const clientRowSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  phone: z.string().min(1, "Téléphone requis"),
  email: z.string().email("Email invalide").nullable(),
  source: z.enum(VALID_SOURCES).default("OTHER"),
  pipelineStage: z.enum(VALID_PIPELINE_STAGES).default("NEW"),
  budgetMin: z.number().nullable(),
  budgetMax: z.number().nullable(),
});

const propertyRowSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  type: z.enum(VALID_PROPERTY_TYPES),
  status: z.enum(VALID_PROPERTY_STATUSES).default("AVAILABLE"),
  price: z.number().nullable(),
  surface: z.number().nullable(),
  rooms: z.number().int().nullable(),
  floor: z.number().int().nullable(),
  transactionType: z.enum(VALID_TRANSACTION_TYPES).default("SALE"),
  projectName: z.string().nullable(),
});

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export clients to CSV string.
 */
export async function exportClientsCsv(
  tenantId: string,
  filters?: { stage?: string; agentId?: string; source?: string },
): Promise<string> {
  const db = createTenantPrisma(tenantId);

  const where: Record<string, unknown> = {};
  if (filters?.stage) where.pipelineStage = filters.stage;
  if (filters?.agentId) where.assignedAgentId = filters.agentId;
  if (filters?.source) where.source = filters.source;

  const clients = await db.client.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      assignedAgent: { select: { firstName: true, lastName: true } },
    },
  });

  const headers = [
    "Nom", "Prénom", "Téléphone", "Email", "Source",
    "Étape Pipeline", "Agent", "Budget Min", "Budget Max", "Date création",
  ];

  const rows = (clients as Array<{
    lastName: string;
    firstName: string;
    phone: string;
    email: string | null;
    source: string;
    pipelineStage: string;
    assignedAgent: { firstName: string; lastName: string } | null;
    budgetMin: unknown;
    budgetMax: unknown;
    createdAt: Date;
  }>).map((c) => [
    escapeCsvField(c.lastName),
    escapeCsvField(c.firstName),
    escapeCsvField(c.phone),
    escapeCsvField(c.email ?? ""),
    escapeCsvField(c.source),
    escapeCsvField(c.pipelineStage),
    escapeCsvField(
      c.assignedAgent
        ? `${c.assignedAgent.firstName} ${c.assignedAgent.lastName}`
        : "",
    ),
    c.budgetMin != null ? String(c.budgetMin) : "",
    c.budgetMax != null ? String(c.budgetMax) : "",
    escapeCsvField(new Date(c.createdAt).toISOString()),
  ]);

  return [headers.map(escapeCsvField).join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/**
 * Export properties to CSV string.
 */
export async function exportPropertiesCsv(
  tenantId: string,
  filters?: { type?: string; status?: string; transactionType?: string; projectId?: string },
): Promise<string> {
  const db = createTenantPrisma(tenantId);

  const where: Record<string, unknown> = {};
  if (filters?.type) where.type = filters.type;
  if (filters?.status) where.status = filters.status;
  if (filters?.transactionType) where.transactionType = filters.transactionType;
  if (filters?.projectId) where.projectId = filters.projectId;

  const properties = await db.property.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { name: true } },
    },
  });

  const headers = [
    "Nom", "Type", "Statut", "Prix", "Surface",
    "Pièces", "Étage", "Transaction", "Projet", "Date création",
  ];

  const rows = (properties as Array<{
    name: string;
    type: string;
    status: string;
    price: unknown;
    surface: number | null;
    rooms: number | null;
    floor: number | null;
    transactionType: string;
    project: { name: string } | null;
    createdAt: Date;
  }>).map((p) => [
    escapeCsvField(p.name),
    escapeCsvField(p.type),
    escapeCsvField(p.status),
    p.price != null ? String(p.price) : "",
    p.surface != null ? String(p.surface) : "",
    p.rooms != null ? String(p.rooms) : "",
    p.floor != null ? String(p.floor) : "",
    escapeCsvField(p.transactionType),
    escapeCsvField(p.project?.name ?? ""),
    escapeCsvField(new Date(p.createdAt).toISOString()),
  ]);

  return [headers.map(escapeCsvField).join(","), ...rows.map((r) => r.join(","))].join("\n");
}

// ============================================================================
// Parse Functions
// ============================================================================

/**
 * Map CSV header names (French) to internal field names.
 */
const CLIENT_HEADER_MAP: Record<string, keyof IClientRow> = {
  "nom": "lastName",
  "prénom": "firstName",
  "prenom": "firstName",
  "téléphone": "phone",
  "telephone": "phone",
  "email": "email",
  "source": "source",
  "étape pipeline": "pipelineStage",
  "etape pipeline": "pipelineStage",
  "pipeline": "pipelineStage",
  "budget min": "budgetMin",
  "budget max": "budgetMax",
};

const PROPERTY_HEADER_MAP: Record<string, keyof IPropertyRow> = {
  "nom": "name",
  "type": "type",
  "statut": "status",
  "prix": "price",
  "surface": "surface",
  "pièces": "rooms",
  "pieces": "rooms",
  "étage": "floor",
  "etage": "floor",
  "transaction": "transactionType",
  "projet": "projectName",
};

/**
 * Parse a CSV string into validated client objects.
 */
export function parseClientsCsv(
  csvContent: string,
): { data: IClientRow[]; errors: string[] } {
  const { headers, rows } = parseCsvContent(csvContent);
  const errors: string[] = [];
  const data: IClientRow[] = [];

  // Map headers to field names
  const fieldMap: (keyof IClientRow | null)[] = headers.map((h) => {
    const normalized = h.toLowerCase().trim();
    return CLIENT_HEADER_MAP[normalized] ?? null;
  });

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 2; // +2 because header is line 1 and arrays are 0-indexed

    const raw: Record<string, unknown> = {
      firstName: "",
      lastName: "",
      phone: "",
      email: null,
      source: "OTHER",
      pipelineStage: "NEW",
      budgetMin: null,
      budgetMax: null,
    };

    for (let j = 0; j < fieldMap.length; j++) {
      const field = fieldMap[j];
      if (!field || j >= row.length) continue;

      const value = row[j].trim();
      if (value === "") continue;

      if (field === "budgetMin" || field === "budgetMax") {
        const num = parseFloat(value);
        if (!isNaN(num)) raw[field] = num;
      } else if (field === "email") {
        raw[field] = value || null;
      } else {
        raw[field] = value;
      }
    }

    const result = clientRowSchema.safeParse(raw);
    if (result.success) {
      data.push(result.data);
    } else {
      const messages = result.error.issues.map((e) => `${String(e.path.join("."))}: ${e.message}`);
      errors.push(`Ligne ${String(lineNum)}: ${messages.join(", ")}`);
    }
  }

  return { data, errors };
}

/**
 * Parse a CSV string into validated property objects.
 */
export function parsePropertiesCsv(
  csvContent: string,
): { data: IPropertyRow[]; errors: string[] } {
  const { headers, rows } = parseCsvContent(csvContent);
  const errors: string[] = [];
  const data: IPropertyRow[] = [];

  const fieldMap: (keyof IPropertyRow | null)[] = headers.map((h) => {
    const normalized = h.toLowerCase().trim();
    return PROPERTY_HEADER_MAP[normalized] ?? null;
  });

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 2;

    const raw: Record<string, unknown> = {
      name: "",
      type: "APARTMENT",
      status: "AVAILABLE",
      price: null,
      surface: null,
      rooms: null,
      floor: null,
      transactionType: "SALE",
      projectName: null,
    };

    for (let j = 0; j < fieldMap.length; j++) {
      const field = fieldMap[j];
      if (!field || j >= row.length) continue;

      const value = row[j].trim();
      if (value === "") continue;

      if (field === "price" || field === "surface") {
        const num = parseFloat(value);
        if (!isNaN(num)) raw[field] = num;
      } else if (field === "rooms" || field === "floor") {
        const num = parseInt(value, 10);
        if (!isNaN(num)) raw[field] = num;
      } else if (field === "projectName") {
        raw[field] = value || null;
      } else {
        raw[field] = value.toUpperCase();
      }
    }

    const result = propertyRowSchema.safeParse(raw);
    if (result.success) {
      data.push(result.data);
    } else {
      const messages = result.error.issues.map((e) => `${String(e.path.join("."))}: ${e.message}`);
      errors.push(`Ligne ${String(lineNum)}: ${messages.join(", ")}`);
    }
  }

  return { data, errors };
}

// ============================================================================
// Import Functions
// ============================================================================

/**
 * Import clients with deduplication check.
 * Skips clients whose phone number already exists in the tenant.
 */
export async function importClients(
  tenantId: string,
  userId: string,
  clients: IClientRow[],
): Promise<IImportResult> {
  const db = createTenantPrisma(tenantId);
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    const lineLabel = `Client ${String(i + 1)} (${client.firstName} ${client.lastName})`;

    try {
      const normalizedPhone = normalizePhone(client.phone);

      // Check for duplicate phone via dedup service
      const dedupResult = await checkDuplicates(tenantId, {
        phone: normalizedPhone,
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
      });

      if (!dedupResult.canCreate) {
        skipped++;
        continue;
      }

      await (db.client.create as unknown as (args: { data: Record<string, unknown> }) => Promise<unknown>)({
        data: {
          firstName: client.firstName,
          lastName: client.lastName,
          phone: normalizedPhone,
          email: client.email?.toLowerCase() ?? null,
          source: client.source,
          pipelineStage: client.pipelineStage,
          budgetMin: client.budgetMin,
          budgetMax: client.budgetMax,
          assignedAgentId: userId,
        },
      });

      imported++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      errors.push(`${lineLabel}: ${message}`);
    }
  }

  return { imported, skipped, errors };
}

/**
 * Import properties into the tenant.
 * Resolves project name to project ID if provided.
 */
export async function importProperties(
  tenantId: string,
  _userId: string,
  properties: IPropertyRow[],
): Promise<IImportResult> {
  const db = createTenantPrisma(tenantId);
  let imported = 0;
  const skipped = 0;
  const errors: string[] = [];

  // Pre-fetch projects for name → ID resolution
  const projects = await db.project.findMany({
    select: { id: true, name: true },
  }) as Array<{ id: string; name: string }>;

  const projectMap = new Map<string, string>();
  for (const p of projects) {
    projectMap.set(p.name.toLowerCase(), p.id);
  }

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    const lineLabel = `Bien ${String(i + 1)} (${prop.name})`;

    try {
      let projectId: string | null = null;
      if (prop.projectName) {
        const found = projectMap.get(prop.projectName.toLowerCase());
        if (found) {
          projectId = found;
        } else {
          errors.push(`${lineLabel}: Projet "${prop.projectName}" introuvable, importé sans projet`);
        }
      }

      await (db.property.create as unknown as (args: { data: Record<string, unknown> }) => Promise<unknown>)({
        data: {
          name: prop.name,
          type: prop.type,
          status: prop.status,
          price: prop.price,
          surface: prop.surface,
          rooms: prop.rooms,
          floor: prop.floor,
          transactionType: prop.transactionType,
          projectId,
        },
      });

      imported++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      errors.push(`${lineLabel}: ${message}`);
    }
  }

  return { imported, skipped, errors };
}
