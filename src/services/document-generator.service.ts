import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { renderDocumentToPdf } from "@/lib/pdf-renderer";

// ============================================================================
// Types
// ============================================================================

export type DocumentType =
  | "BON_RESERVATION"
  | "RECU_PAIEMENT"
  | "FICHE_VISITE"
  | "COMPROMIS_VENTE"
  | "BON_COMMANDE"
  | "ETAT_DES_LIEUX"
  | "CONTRAT_LOCATION";

export interface IDocumentInput {
  type: DocumentType;
  tenantId: string;
  clientId: string;
  propertyId?: string;
  paymentId?: string;
  visitId?: string;
}

// ============================================================================
// Helpers
// ============================================================================

function formatDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPrice(n: number): string {
  return (
    new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(n) +
    " DA"
  );
}

function generateRef(): string {
  return `DOC-${Date.now().toString(36).toUpperCase()}`;
}

// ============================================================================
// Shared Styles
// ============================================================================

const colors = {
  dark: "#1e293b",
  gray: "#64748b",
  lightGray: "#94a3b8",
  border: "#e2e8f0",
  bgLight: "#f1f5f9",
  accent: "#3b82f6",
  bgHighlight: "#eff6ff",
  highlightBorder: "#bfdbfe",
  red: "#dc2626",
  green: "#16a34a",
};

const s = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: colors.dark,
    lineHeight: 1.6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
    paddingBottom: 12,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: colors.dark,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.gray,
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerDate: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  headerRef: {
    fontSize: 9,
    color: colors.lightGray,
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.dark,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 160,
    color: colors.gray,
    fontFamily: "Helvetica",
  },
  value: {
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  highlight: {
    backgroundColor: colors.bgHighlight,
    borderWidth: 1,
    borderColor: colors.highlightBorder,
    borderRadius: 4,
    padding: 10,
    marginVertical: 8,
  },
  amount: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: colors.dark,
  },
  amountSub: {
    fontSize: 10,
    color: colors.gray,
    marginTop: 3,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.bgLight,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.gray,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgLight,
  },
  tableCell: {
    fontSize: 10,
  },
  signatureBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 50,
  },
  signatureBox: {
    width: 180,
    alignItems: "center",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: colors.dark,
    marginTop: 50,
    paddingTop: 4,
    width: "100%",
    alignItems: "center",
  },
  signatureLabel: {
    fontSize: 10,
    color: colors.gray,
  },
  footer: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: colors.lightGray,
  },
  emptyBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 10,
    minHeight: 80,
  },
  emptyBoxText: {
    fontSize: 11,
    color: colors.gray,
  },
});

// ============================================================================
// Reusable layout components
// ============================================================================

function DocHeader({
  tenantName,
  docTitle,
  docDate,
}: {
  tenantName: string;
  docTitle: string;
  docDate: Date;
}) {
  return React.createElement(
    View,
    { style: s.header },
    React.createElement(
      View,
      null,
      React.createElement(Text, { style: s.headerTitle }, tenantName),
      React.createElement(Text, { style: s.headerSubtitle }, docTitle),
    ),
    React.createElement(
      View,
      { style: s.headerRight },
      React.createElement(Text, { style: s.headerDate }, formatDate(docDate)),
      React.createElement(
        Text,
        { style: s.headerRef },
        `Réf: ${generateRef()}`,
      ),
    ),
  );
}

function DocFooter({ tenantName }: { tenantName: string }) {
  return React.createElement(
    View,
    { style: s.footer },
    React.createElement(
      Text,
      { style: s.footerText },
      `Document généré par CRM IMMO PRO X — ${tenantName} — ${formatDate(new Date())}`,
    ),
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return React.createElement(
    View,
    { style: s.section },
    React.createElement(Text, { style: s.sectionTitle }, title),
    children,
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return React.createElement(
    View,
    { style: s.row },
    React.createElement(Text, { style: s.label }, label),
    React.createElement(Text, { style: s.value }, value),
  );
}

function SignatureBlock({
  leftLabel,
  rightLabel,
}: {
  leftLabel: string;
  rightLabel: string;
}) {
  return React.createElement(
    View,
    { style: s.signatureBlock },
    React.createElement(
      View,
      { style: s.signatureBox },
      React.createElement(
        View,
        { style: s.signatureLine },
        React.createElement(Text, { style: s.signatureLabel }, leftLabel),
      ),
    ),
    React.createElement(
      View,
      { style: s.signatureBox },
      React.createElement(
        View,
        { style: s.signatureLine },
        React.createElement(Text, { style: s.signatureLabel }, rightLabel),
      ),
    ),
  );
}

// ============================================================================
// Helpers to build property rows
// ============================================================================

interface IPropertyBasic {
  name: string;
  type: string;
  surface?: number | null;
  rooms?: number | null;
  floor?: number | null;
  price?: unknown;
  project?: { name: string; address?: string | null; wilaya?: string | null } | null;
  cadastralRef?: string | null;
  lotNumber?: string | null;
  titleDeedNumber?: string | null;
}

function buildPropertyRows(
  property: IPropertyBasic,
  keyPrefix: string,
  priceLabel = "Prix",
): React.ReactElement[] {
  const rows: React.ReactElement[] = [];
  rows.push(React.createElement(Row, { key: `${keyPrefix}-n`, label: "Désignation", value: property.name }));
  rows.push(React.createElement(Row, { key: `${keyPrefix}-t`, label: "Type", value: property.type }));
  if (property.surface) rows.push(React.createElement(Row, { key: `${keyPrefix}-s`, label: "Surface", value: `${property.surface} m²` }));
  if (property.rooms) rows.push(React.createElement(Row, { key: `${keyPrefix}-r`, label: "Pièces", value: String(property.rooms) }));
  if (property.floor !== null && property.floor !== undefined) rows.push(React.createElement(Row, { key: `${keyPrefix}-f`, label: "Étage", value: String(property.floor) }));
  if (property.price) rows.push(React.createElement(Row, { key: `${keyPrefix}-p`, label: priceLabel, value: formatPrice(Number(property.price)) }));
  if (property.cadastralRef) rows.push(React.createElement(Row, { key: `${keyPrefix}-cad`, label: "Réf. cadastrale", value: property.cadastralRef }));
  if (property.lotNumber) rows.push(React.createElement(Row, { key: `${keyPrefix}-lot`, label: "N° de lot", value: property.lotNumber }));
  if (property.titleDeedNumber) rows.push(React.createElement(Row, { key: `${keyPrefix}-td`, label: "N° acte", value: property.titleDeedNumber }));
  if (property.project) {
    let projVal = property.project.name;
    if (property.project.address) projVal += ` — ${property.project.address}`;
    if (property.project.wilaya) projVal += `, ${property.project.wilaya}`;
    rows.push(React.createElement(Row, { key: `${keyPrefix}-pj`, label: "Projet", value: projVal }));
  }
  return rows;
}

// ============================================================================
// BON DE RÉSERVATION
// ============================================================================

async function buildBonReservation(
  tenantId: string,
  clientId: string,
  propertyId?: string,
): Promise<React.ReactElement> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });

  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId },
    select: { firstName: true, lastName: true, phone: true, email: true },
  });
  if (!client) throw new Error("Client introuvable");

  let propId = propertyId;
  if (!propId) {
    const payment = await prisma.payment.findFirst({
      where: { clientId, tenantId, type: "RESERVATION", propertyId: { not: null } },
      select: { propertyId: true },
    });
    propId = payment?.propertyId ?? undefined;
  }

  const property = propId
    ? await prisma.property.findFirst({
        where: { id: propId, tenantId },
        select: {
          name: true, type: true, surface: true, rooms: true, floor: true, price: true,
          project: { select: { name: true, address: true } },
        },
      })
    : null;

  const reservationPayment = await prisma.payment.findFirst({
    where: { clientId, tenantId, type: "RESERVATION" },
    select: { amount: true, createdAt: true, status: true },
    orderBy: { createdAt: "desc" },
  });

  const tenantName = tenant?.name ?? "CRM IMMO PRO X";

  const paymentContent = reservationPayment
    ? React.createElement(
        View,
        { style: s.highlight },
        React.createElement(Text, { style: s.amount }, formatPrice(Number(reservationPayment.amount))),
        React.createElement(
          Text,
          { style: s.amountSub },
          `Versé le ${formatDate(reservationPayment.createdAt)} — Statut : ${reservationPayment.status === "COMPLETED" ? "Encaissé" : "En attente"}`,
        ),
      )
    : React.createElement(
        Text,
        { style: { fontSize: 11, color: colors.lightGray } },
        "Aucun paiement de réservation enregistré",
      );

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: s.page },
      React.createElement(DocHeader, {
        tenantName,
        docTitle: "Bon de Réservation",
        docDate: reservationPayment?.createdAt ?? new Date(),
      }),
      React.createElement(
        Section,
        { title: "Réservant" },
        React.createElement(Row, { label: "Nom complet", value: `${client.firstName} ${client.lastName}` }),
        React.createElement(Row, { label: "Téléphone", value: client.phone }),
        client.email ? React.createElement(Row, { label: "Email", value: client.email }) : null,
      ),
      property
        ? React.createElement(Section, { title: "Bien réservé" }, ...buildPropertyRows(property, "br"))
        : null,
      React.createElement(Section, { title: "Acompte de réservation" }, paymentContent),
      React.createElement(SignatureBlock, { leftLabel: "Le réservant", rightLabel: "Le promoteur" }),
      React.createElement(DocFooter, { tenantName }),
    ),
  );
}

// ============================================================================
// REÇU DE PAIEMENT
// ============================================================================

async function buildRecuPaiement(
  tenantId: string,
  clientId: string,
  paymentId?: string,
): Promise<React.ReactElement> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });

  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId },
    select: { firstName: true, lastName: true, phone: true },
  });
  if (!client) throw new Error("Client introuvable");

  const payment = paymentId
    ? await prisma.payment.findFirst({
        where: { id: paymentId, tenantId },
        select: { amount: true, type: true, status: true, createdAt: true, propertyId: true },
      })
    : await prisma.payment.findFirst({
        where: { clientId, tenantId, status: "COMPLETED" },
        select: { amount: true, type: true, status: true, createdAt: true, propertyId: true },
        orderBy: { createdAt: "desc" },
      });

  if (!payment) throw new Error("Paiement introuvable");

  const allPayments = await prisma.payment.findMany({
    where: { clientId, tenantId },
    select: { amount: true, status: true },
  });

  const totalPaid = allPayments
    .filter((p) => p.status === "COMPLETED")
    .reduce((acc, p) => acc + Number(p.amount), 0);
  const totalDue = allPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  const remaining = totalDue - totalPaid;

  const typeLabels: Record<string, string> = {
    RESERVATION: "Réservation",
    INSTALLMENT: "Tranche",
    FINAL: "Solde final",
    COMMISSION: "Commission",
    REFUND: "Remboursement",
  };

  const tenantName = tenant?.name ?? "CRM IMMO PRO X";

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: s.page },
      React.createElement(DocHeader, { tenantName, docTitle: "Reçu de Paiement", docDate: payment.createdAt }),
      React.createElement(
        Section,
        { title: "Client" },
        React.createElement(Row, { label: "Nom complet", value: `${client.firstName} ${client.lastName}` }),
        React.createElement(Row, { label: "Téléphone", value: client.phone }),
      ),
      React.createElement(
        Section,
        { title: "Détail du paiement" },
        React.createElement(
          View,
          { style: s.highlight },
          React.createElement(Text, { style: s.amount }, formatPrice(Number(payment.amount))),
          React.createElement(
            Text,
            { style: s.amountSub },
            `${typeLabels[payment.type] ?? payment.type} — ${formatDate(payment.createdAt)}`,
          ),
        ),
      ),
      React.createElement(
        Section,
        { title: "Situation financière" },
        React.createElement(Row, { label: "Total versé", value: formatPrice(totalPaid) }),
        React.createElement(Row, { label: "Total dû", value: formatPrice(totalDue) }),
        React.createElement(
          View,
          { style: s.row },
          React.createElement(Text, { style: s.label }, "Solde restant"),
          React.createElement(
            Text,
            { style: [s.value, { color: remaining > 0 ? colors.red : colors.green }] },
            formatPrice(remaining),
          ),
        ),
      ),
      React.createElement(SignatureBlock, { leftLabel: "Le client", rightLabel: "Le responsable" }),
      React.createElement(DocFooter, { tenantName }),
    ),
  );
}

// ============================================================================
// FICHE DE VISITE
// ============================================================================

async function buildFicheVisite(
  tenantId: string,
  clientId: string,
  propertyId?: string,
  visitId?: string,
): Promise<React.ReactElement> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });

  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId },
    select: { firstName: true, lastName: true, phone: true, budgetMin: true, budgetMax: true },
  });
  if (!client) throw new Error("Client introuvable");

  const visitInclude = {
    property: {
      select: {
        name: true, type: true, surface: true, rooms: true, price: true,
        project: { select: { name: true, address: true } },
      },
    },
    agent: { select: { firstName: true, lastName: true, phone: true } },
  };

  const visit = visitId
    ? await prisma.visit.findFirst({
        where: { id: visitId, tenantId },
        include: visitInclude,
      })
    : await prisma.visit.findFirst({
        where: { clientId, tenantId, ...(propertyId ? { propertyId } : {}) },
        include: visitInclude,
        orderBy: { scheduledAt: "desc" },
      });

  const tenantName = tenant?.name ?? "CRM IMMO PRO X";

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: s.page },
      React.createElement(DocHeader, {
        tenantName,
        docTitle: "Fiche de Visite",
        docDate: visit?.scheduledAt ?? new Date(),
      }),
      React.createElement(
        Section,
        { title: "Client" },
        React.createElement(Row, { label: "Nom complet", value: `${client.firstName} ${client.lastName}` }),
        React.createElement(Row, { label: "Téléphone", value: client.phone }),
        client.budgetMin || client.budgetMax
          ? React.createElement(Row, {
              label: "Budget",
              value: `${client.budgetMin ? formatPrice(Number(client.budgetMin)) : "?"} — ${client.budgetMax ? formatPrice(Number(client.budgetMax)) : "?"}`,
            })
          : null,
      ),
      visit?.property
        ? React.createElement(Section, { title: "Bien visité" }, ...buildPropertyRows(visit.property, "fv"))
        : null,
      React.createElement(
        Section,
        { title: "Détails de la visite" },
        React.createElement(Row, { label: "Date", value: visit ? formatDate(visit.scheduledAt) : "Non programmée" }),
        React.createElement(Row, { label: "Statut", value: visit?.status ?? "—" }),
        visit?.agent
          ? React.createElement(Row, {
              label: "Agent",
              value: `${visit.agent.firstName} ${visit.agent.lastName} (${visit.agent.phone ?? ""})`,
            })
          : null,
      ),
      React.createElement(
        Section,
        { title: "Observations" },
        React.createElement(
          View,
          { style: s.emptyBox },
          React.createElement(Text, { style: s.emptyBoxText }, visit?.feedback ?? "À compléter après la visite..."),
        ),
      ),
      React.createElement(SignatureBlock, { leftLabel: "Le client", rightLabel: "L'agent" }),
      React.createElement(DocFooter, { tenantName }),
    ),
  );
}

// ============================================================================
// COMPROMIS DE VENTE
// ============================================================================

async function buildCompromisVente(
  tenantId: string,
  clientId: string,
  propertyId?: string,
): Promise<React.ReactElement> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });

  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId },
    select: { firstName: true, lastName: true, phone: true, email: true },
  });
  if (!client) throw new Error("Client introuvable");

  let propId = propertyId;
  if (!propId) {
    const payment = await prisma.payment.findFirst({
      where: { clientId, tenantId, propertyId: { not: null } },
      select: { propertyId: true },
    });
    propId = payment?.propertyId ?? undefined;
  }

  const property = propId
    ? await prisma.property.findFirst({
        where: { id: propId, tenantId },
        select: {
          name: true, type: true, surface: true, rooms: true, floor: true, price: true,
          cadastralRef: true, lotNumber: true, titleDeedNumber: true,
          project: { select: { name: true, address: true, wilaya: true } },
        },
      })
    : null;

  const payments = await prisma.payment.findMany({
    where: { clientId, tenantId },
    select: { type: true, amount: true, status: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const typeLabels: Record<string, string> = {
    RESERVATION: "Réservation",
    INSTALLMENT: "Tranche",
    FINAL: "Solde final",
    COMMISSION: "Commission",
    REFUND: "Remboursement",
  };

  const tenantName = tenant?.name ?? "CRM IMMO PRO X";

  const paymentTableRows = payments.map((p, i) =>
    React.createElement(
      View,
      { key: `pay-${i}`, style: s.tableRow },
      React.createElement(Text, { style: [s.tableCell, { width: "25%" }] }, typeLabels[p.type] ?? p.type),
      React.createElement(
        Text,
        { style: [s.tableCell, { width: "25%", textAlign: "right", fontFamily: "Helvetica-Bold" }] },
        formatPrice(Number(p.amount)),
      ),
      React.createElement(Text, { style: [s.tableCell, { width: "25%" }] }, formatDate(p.createdAt)),
      React.createElement(
        Text,
        { style: [s.tableCell, { width: "25%" }] },
        p.status === "COMPLETED" ? "Payé" : p.status === "PENDING" ? "En attente" : p.status,
      ),
    ),
  );

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: s.page },
      React.createElement(DocHeader, { tenantName, docTitle: "Compromis de Vente", docDate: new Date() }),
      React.createElement(
        Section,
        { title: "Le vendeur" },
        React.createElement(Row, { label: "Société", value: tenantName }),
      ),
      React.createElement(
        Section,
        { title: "L'acquéreur" },
        React.createElement(Row, { label: "Nom complet", value: `${client.firstName} ${client.lastName}` }),
        React.createElement(Row, { label: "Téléphone", value: client.phone }),
        client.email ? React.createElement(Row, { label: "Email", value: client.email }) : null,
      ),
      property
        ? React.createElement(Section, { title: "Objet de la vente" }, ...buildPropertyRows(property, "cv", "Prix de vente"))
        : null,
      payments.length > 0
        ? React.createElement(
            Section,
            { title: "Conditions financières" },
            React.createElement(
              View,
              { style: s.tableHeader },
              React.createElement(Text, { style: [s.tableHeaderCell, { width: "25%" }] }, "Type"),
              React.createElement(Text, { style: [s.tableHeaderCell, { width: "25%", textAlign: "right" }] }, "Montant"),
              React.createElement(Text, { style: [s.tableHeaderCell, { width: "25%" }] }, "Date"),
              React.createElement(Text, { style: [s.tableHeaderCell, { width: "25%" }] }, "Statut"),
            ),
            ...paymentTableRows,
          )
        : null,
      React.createElement(
        Section,
        { title: "Conditions particulières" },
        React.createElement(
          View,
          { style: s.emptyBox },
          React.createElement(Text, { style: s.emptyBoxText }, "À compléter..."),
        ),
      ),
      React.createElement(
        Text,
        { style: { fontSize: 10, color: colors.gray, marginVertical: 16 } },
        `Fait en deux exemplaires originaux, à ________________, le ${formatDate(new Date())}.`,
      ),
      React.createElement(SignatureBlock, { leftLabel: "L'acquéreur", rightLabel: "Le vendeur" }),
      React.createElement(DocFooter, { tenantName }),
    ),
  );
}

// ============================================================================
// BON DE COMMANDE
// ============================================================================

async function buildBonCommande(
  tenantId: string,
  clientId: string,
  propertyId?: string,
): Promise<React.ReactElement> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });

  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId },
    select: { firstName: true, lastName: true, phone: true, email: true },
  });
  if (!client) throw new Error("Client introuvable");

  let propId = propertyId;
  if (!propId) {
    const payment = await prisma.payment.findFirst({
      where: { clientId, tenantId, propertyId: { not: null } },
      select: { propertyId: true },
    });
    propId = payment?.propertyId ?? undefined;
  }

  const property = propId
    ? await prisma.property.findFirst({
        where: { id: propId, tenantId },
        select: {
          name: true, type: true, surface: true, rooms: true, floor: true, price: true,
          project: { select: { name: true, address: true } },
        },
      })
    : null;

  const tenantName = tenant?.name ?? "CRM IMMO PRO X";

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: s.page },
      React.createElement(DocHeader, { tenantName, docTitle: "Bon de Commande", docDate: new Date() }),
      React.createElement(
        Section,
        { title: "Commanditaire" },
        React.createElement(Row, { label: "Nom complet", value: `${client.firstName} ${client.lastName}` }),
        React.createElement(Row, { label: "Téléphone", value: client.phone }),
        client.email ? React.createElement(Row, { label: "Email", value: client.email }) : null,
      ),
      property
        ? React.createElement(Section, { title: "Bien commandé" }, ...buildPropertyRows(property, "bc", "Prix unitaire"))
        : null,
      property?.price
        ? React.createElement(
            Section,
            { title: "Montant total" },
            React.createElement(
              View,
              { style: s.highlight },
              React.createElement(Text, { style: s.amount }, formatPrice(Number(property.price))),
              React.createElement(Text, { style: s.amountSub }, "Montant TTC"),
            ),
          )
        : null,
      React.createElement(
        Section,
        { title: "Conditions de livraison" },
        React.createElement(
          View,
          { style: s.emptyBox },
          React.createElement(Text, { style: s.emptyBoxText }, "À compléter..."),
        ),
      ),
      React.createElement(SignatureBlock, { leftLabel: "Le commanditaire", rightLabel: "Le fournisseur" }),
      React.createElement(DocFooter, { tenantName }),
    ),
  );
}

// ============================================================================
// ÉTAT DES LIEUX
// ============================================================================

async function buildEtatDesLieux(
  tenantId: string,
  clientId: string,
  propertyId?: string,
): Promise<React.ReactElement> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });

  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId },
    select: { firstName: true, lastName: true, phone: true },
  });
  if (!client) throw new Error("Client introuvable");

  const property = propertyId
    ? await prisma.property.findFirst({
        where: { id: propertyId, tenantId },
        select: {
          name: true, type: true, surface: true, rooms: true, floor: true,
          project: { select: { name: true, address: true } },
        },
      })
    : null;

  const tenantName = tenant?.name ?? "CRM IMMO PRO X";

  const roomLabels = [
    "Entrée", "Salon / Séjour", "Cuisine", "Chambre 1",
    "Chambre 2", "Salle de bain", "WC", "Balcon / Terrasse",
  ];

  const roomRows = roomLabels.map((room, i) =>
    React.createElement(
      View,
      { key: `room-${i}`, style: s.tableRow },
      React.createElement(Text, { style: [s.tableCell, { width: "30%" }] }, room),
      React.createElement(Text, { style: [s.tableCell, { width: "20%", textAlign: "center" }] }, "Bon"),
      React.createElement(Text, { style: [s.tableCell, { width: "50%" }] }, ""),
    ),
  );

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: s.page },
      React.createElement(DocHeader, { tenantName, docTitle: "État des Lieux", docDate: new Date() }),
      React.createElement(
        Section,
        { title: "Locataire / Occupant" },
        React.createElement(Row, { label: "Nom complet", value: `${client.firstName} ${client.lastName}` }),
        React.createElement(Row, { label: "Téléphone", value: client.phone }),
      ),
      property
        ? React.createElement(
            Section,
            { title: "Bien concerné" },
            React.createElement(Row, { label: "Désignation", value: property.name }),
            React.createElement(Row, { label: "Type", value: property.type }),
            property.surface ? React.createElement(Row, { label: "Surface", value: `${property.surface} m²` }) : null,
            property.rooms ? React.createElement(Row, { label: "Pièces", value: String(property.rooms) }) : null,
            property.floor !== null && property.floor !== undefined
              ? React.createElement(Row, { label: "Étage", value: String(property.floor) })
              : null,
            property.project
              ? React.createElement(Row, {
                  label: "Adresse",
                  value: property.project.name + (property.project.address ? ` — ${property.project.address}` : ""),
                })
              : null,
          )
        : null,
      React.createElement(
        Section,
        { title: "Constat par pièce" },
        React.createElement(
          View,
          { style: s.tableHeader },
          React.createElement(Text, { style: [s.tableHeaderCell, { width: "30%" }] }, "Pièce"),
          React.createElement(Text, { style: [s.tableHeaderCell, { width: "20%", textAlign: "center" }] }, "État"),
          React.createElement(Text, { style: [s.tableHeaderCell, { width: "50%" }] }, "Observations"),
        ),
        ...roomRows,
      ),
      React.createElement(
        Section,
        { title: "Relevés compteurs" },
        React.createElement(Row, { label: "Électricité", value: "__________ kWh" }),
        React.createElement(Row, { label: "Gaz", value: "__________ m³" }),
        React.createElement(Row, { label: "Eau", value: "__________ m³" }),
      ),
      React.createElement(
        Section,
        { title: "Observations générales" },
        React.createElement(
          View,
          { style: s.emptyBox },
          React.createElement(Text, { style: s.emptyBoxText }, "À compléter..."),
        ),
      ),
      React.createElement(SignatureBlock, { leftLabel: "Le locataire", rightLabel: "Le bailleur" }),
      React.createElement(DocFooter, { tenantName }),
    ),
  );
}

// ============================================================================
// CONTRAT DE LOCATION
// ============================================================================

async function buildContratLocation(
  tenantId: string,
  clientId: string,
  propertyId?: string,
): Promise<React.ReactElement> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });

  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId },
    select: { firstName: true, lastName: true, phone: true, email: true },
  });
  if (!client) throw new Error("Client introuvable");

  const property = propertyId
    ? await prisma.property.findFirst({
        where: { id: propertyId, tenantId },
        select: {
          name: true, type: true, surface: true, rooms: true, floor: true, price: true,
          project: { select: { name: true, address: true, wilaya: true } },
        },
      })
    : null;

  const tenantName = tenant?.name ?? "CRM IMMO PRO X";

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: s.page },
      React.createElement(DocHeader, { tenantName, docTitle: "Contrat de Location", docDate: new Date() }),
      React.createElement(
        Section,
        { title: "Le bailleur" },
        React.createElement(Row, { label: "Société / Nom", value: tenantName }),
      ),
      React.createElement(
        Section,
        { title: "Le locataire" },
        React.createElement(Row, { label: "Nom complet", value: `${client.firstName} ${client.lastName}` }),
        React.createElement(Row, { label: "Téléphone", value: client.phone }),
        client.email ? React.createElement(Row, { label: "Email", value: client.email }) : null,
      ),
      property
        ? React.createElement(
            Section,
            { title: "Bien loué" },
            React.createElement(Row, { label: "Désignation", value: property.name }),
            React.createElement(Row, { label: "Type", value: property.type }),
            property.surface ? React.createElement(Row, { label: "Surface", value: `${property.surface} m²` }) : null,
            property.rooms ? React.createElement(Row, { label: "Pièces", value: String(property.rooms) }) : null,
            property.floor !== null && property.floor !== undefined
              ? React.createElement(Row, { label: "Étage", value: String(property.floor) })
              : null,
            property.project
              ? React.createElement(Row, {
                  label: "Adresse",
                  value:
                    property.project.name +
                    (property.project.address ? ` — ${property.project.address}` : "") +
                    (property.project.wilaya ? `, ${property.project.wilaya}` : ""),
                })
              : null,
          )
        : null,
      React.createElement(
        Section,
        { title: "Conditions financières" },
        property?.price
          ? React.createElement(
              View,
              { style: s.highlight },
              React.createElement(Text, { style: s.amount }, formatPrice(Number(property.price))),
              React.createElement(Text, { style: s.amountSub }, "Loyer mensuel"),
            )
          : React.createElement(Text, { style: { fontSize: 11, color: colors.gray } }, "Loyer : à définir"),
        React.createElement(Row, { label: "Caution", value: "__________ DA" }),
        React.createElement(Row, { label: "Charges", value: "__________ DA / mois" }),
      ),
      React.createElement(
        Section,
        { title: "Durée du bail" },
        React.createElement(Row, { label: "Date de début", value: "____________________" }),
        React.createElement(Row, { label: "Durée", value: "__________ mois" }),
        React.createElement(Row, { label: "Renouvellement", value: "Tacite reconduction / À préciser" }),
      ),
      React.createElement(
        Section,
        { title: "Clauses particulières" },
        React.createElement(
          View,
          { style: s.emptyBox },
          React.createElement(Text, { style: s.emptyBoxText }, "À compléter..."),
        ),
      ),
      React.createElement(
        Text,
        { style: { fontSize: 10, color: colors.gray, marginVertical: 16 } },
        `Fait en deux exemplaires originaux, à ________________, le ${formatDate(new Date())}.`,
      ),
      React.createElement(SignatureBlock, { leftLabel: "Le locataire", rightLabel: "Le bailleur" }),
      React.createElement(DocFooter, { tenantName }),
    ),
  );
}

// ============================================================================
// API publique
// ============================================================================

/**
 * Génère un document PDF selon le type demandé.
 * Retourne un Buffer PDF.
 */
export async function generateDocument(input: IDocumentInput): Promise<Buffer> {
  let element: React.ReactElement;

  switch (input.type) {
    case "BON_RESERVATION":
      element = await buildBonReservation(input.tenantId, input.clientId, input.propertyId);
      break;
    case "RECU_PAIEMENT":
      element = await buildRecuPaiement(input.tenantId, input.clientId, input.paymentId);
      break;
    case "FICHE_VISITE":
      element = await buildFicheVisite(input.tenantId, input.clientId, input.propertyId, input.visitId);
      break;
    case "COMPROMIS_VENTE":
      element = await buildCompromisVente(input.tenantId, input.clientId, input.propertyId);
      break;
    case "BON_COMMANDE":
      element = await buildBonCommande(input.tenantId, input.clientId, input.propertyId);
      break;
    case "ETAT_DES_LIEUX":
      element = await buildEtatDesLieux(input.tenantId, input.clientId, input.propertyId);
      break;
    case "CONTRAT_LOCATION":
      element = await buildContratLocation(input.tenantId, input.clientId, input.propertyId);
      break;
    default:
      throw new Error(`Type de document inconnu : ${String(input.type)}`);
  }

  return renderDocumentToPdf(element);
}
