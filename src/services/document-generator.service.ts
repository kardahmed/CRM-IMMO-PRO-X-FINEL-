import { prisma } from "@/lib/prisma";
import { htmlToPdf } from "@/lib/pdf-renderer";

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

function baseStyles(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 20px; font-weight: 800; color: #1e293b; }
    .header .subtitle { font-size: 13px; color: #64748b; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 14px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px; }
    .row { display: flex; margin-bottom: 6px; font-size: 13px; }
    .label { width: 180px; color: #64748b; font-weight: 500; }
    .value { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
    th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; color: #64748b; }
    td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
    .signature-block { display: flex; justify-content: space-between; margin-top: 60px; }
    .signature-box { width: 200px; text-align: center; }
    .signature-line { border-top: 1px solid #1e293b; margin-top: 60px; padding-top: 4px; font-size: 12px; color: #64748b; }
    .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 8px; text-align: center; font-size: 10px; color: #94a3b8; }
    .highlight { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 12px 16px; margin: 12px 0; }
    .amount { font-size: 22px; font-weight: 800; color: #1e293b; }
  `;
}

function docHeader(tenantName: string, docTitle: string, docDate: Date): string {
  return `
    <div class="header">
      <div>
        <h1>${tenantName}</h1>
        <p class="subtitle">${docTitle}</p>
      </div>
      <div style="text-align:right">
        <p style="font-size:13px;font-weight:600">${formatDate(docDate)}</p>
        <p style="font-size:11px;color:#94a3b8">Réf: DOC-${Date.now().toString(36).toUpperCase()}</p>
      </div>
    </div>
  `;
}

function docFooter(tenantName: string): string {
  return `<div class="footer">Document généré par CRM IMMO PRO X — ${tenantName} — ${formatDate(new Date())}</div>`;
}

// ============================================================================
// BON DE RÉSERVATION
// ============================================================================

async function buildBonReservation(
  tenantId: string,
  clientId: string,
  propertyId?: string,
): Promise<string> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });

  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId },
    select: {
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
    },
  });
  if (!client) throw new Error("Client introuvable");

  // Trouver le bien (param ou via paiement)
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
          name: true,
          type: true,
          surface: true,
          rooms: true,
          floor: true,
          price: true,
          project: { select: { name: true, address: true } },
        },
      })
    : null;

  // Paiement de réservation
  const reservationPayment = await prisma.payment.findFirst({
    where: { clientId, tenantId, type: "RESERVATION" },
    select: { amount: true, createdAt: true, status: true },
    orderBy: { createdAt: "desc" },
  });

  const tenantName = tenant?.name ?? "CRM IMMO PRO X";

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>${baseStyles()}</style></head><body>
    ${docHeader(tenantName, "Bon de Réservation", reservationPayment?.createdAt ?? new Date())}

    <div class="section">
      <div class="section-title">Réservant</div>
      <div class="row"><span class="label">Nom complet</span><span class="value">${client.firstName} ${client.lastName}</span></div>
      <div class="row"><span class="label">Téléphone</span><span class="value">${client.phone}</span></div>
      ${client.email ? `<div class="row"><span class="label">Email</span><span class="value">${client.email}</span></div>` : ""}
    </div>

    ${
      property
        ? `<div class="section">
      <div class="section-title">Bien réservé</div>
      <div class="row"><span class="label">Désignation</span><span class="value">${property.name}</span></div>
      <div class="row"><span class="label">Type</span><span class="value">${property.type}</span></div>
      ${property.surface ? `<div class="row"><span class="label">Surface</span><span class="value">${property.surface} m²</span></div>` : ""}
      ${property.rooms ? `<div class="row"><span class="label">Pièces</span><span class="value">${property.rooms}</span></div>` : ""}
      ${property.floor !== null && property.floor !== undefined ? `<div class="row"><span class="label">Étage</span><span class="value">${property.floor}</span></div>` : ""}
      ${property.price ? `<div class="row"><span class="label">Prix</span><span class="value">${formatPrice(Number(property.price))}</span></div>` : ""}
      ${property.project ? `<div class="row"><span class="label">Projet</span><span class="value">${property.project.name}${property.project.address ? ` — ${property.project.address}` : ""}</span></div>` : ""}
    </div>`
        : ""
    }

    <div class="section">
      <div class="section-title">Acompte de réservation</div>
      ${
        reservationPayment
          ? `<div class="highlight">
        <div class="amount">${formatPrice(Number(reservationPayment.amount))}</div>
        <p style="font-size:12px;color:#64748b;margin-top:4px">Versé le ${formatDate(reservationPayment.createdAt)} — Statut : ${reservationPayment.status === "COMPLETED" ? "Encaissé" : "En attente"}</p>
      </div>`
          : '<p style="color:#94a3b8;font-size:13px">Aucun paiement de réservation enregistré</p>'
      }
    </div>

    <div class="signature-block">
      <div class="signature-box"><div class="signature-line">Le réservant</div></div>
      <div class="signature-box"><div class="signature-line">Le promoteur</div></div>
    </div>

    ${docFooter(tenantName)}
  </body></html>`;
}

// ============================================================================
// REÇU DE PAIEMENT
// ============================================================================

async function buildRecuPaiement(
  tenantId: string,
  clientId: string,
  paymentId?: string,
): Promise<string> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });

  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId },
    select: { firstName: true, lastName: true, phone: true },
  });
  if (!client) throw new Error("Client introuvable");

  // Paiement spécifique ou le dernier
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

  // Total payé et restant
  const allPayments = await prisma.payment.findMany({
    where: { clientId, tenantId },
    select: { amount: true, status: true },
  });

  const totalPaid = allPayments
    .filter((p) => p.status === "COMPLETED")
    .reduce((s, p) => s + Number(p.amount), 0);

  const totalDue = allPayments.reduce((s, p) => s + Number(p.amount), 0);
  const remaining = totalDue - totalPaid;

  const typeLabels: Record<string, string> = {
    RESERVATION: "Réservation",
    INSTALLMENT: "Tranche",
    FINAL: "Solde final",
    COMMISSION: "Commission",
    REFUND: "Remboursement",
  };

  const tenantName = tenant?.name ?? "CRM IMMO PRO X";

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>${baseStyles()}</style></head><body>
    ${docHeader(tenantName, "Reçu de Paiement", payment.createdAt)}

    <div class="section">
      <div class="section-title">Client</div>
      <div class="row"><span class="label">Nom complet</span><span class="value">${client.firstName} ${client.lastName}</span></div>
      <div class="row"><span class="label">Téléphone</span><span class="value">${client.phone}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Détail du paiement</div>
      <div class="highlight">
        <div class="amount">${formatPrice(Number(payment.amount))}</div>
        <p style="font-size:12px;color:#64748b;margin-top:4px">${typeLabels[payment.type] ?? payment.type} — ${formatDate(payment.createdAt)}</p>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Situation financière</div>
      <div class="row"><span class="label">Total versé</span><span class="value">${formatPrice(totalPaid)}</span></div>
      <div class="row"><span class="label">Total dû</span><span class="value">${formatPrice(totalDue)}</span></div>
      <div class="row"><span class="label">Solde restant</span><span class="value" style="color:${remaining > 0 ? "#dc2626" : "#16a34a"}">${formatPrice(remaining)}</span></div>
    </div>

    <div class="signature-block">
      <div class="signature-box"><div class="signature-line">Le client</div></div>
      <div class="signature-box"><div class="signature-line">Le responsable</div></div>
    </div>

    ${docFooter(tenantName)}
  </body></html>`;
}

// ============================================================================
// FICHE DE VISITE
// ============================================================================

async function buildFicheVisite(
  tenantId: string,
  clientId: string,
  propertyId?: string,
  visitId?: string,
): Promise<string> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });

  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId },
    select: { firstName: true, lastName: true, phone: true, budgetMin: true, budgetMax: true },
  });
  if (!client) throw new Error("Client introuvable");

  // Visite
  const visit = visitId
    ? await prisma.visit.findFirst({
        where: { id: visitId, tenantId },
        include: {
          property: {
            select: { name: true, type: true, surface: true, rooms: true, price: true, project: { select: { name: true, address: true } } },
          },
          agent: { select: { firstName: true, lastName: true, phone: true } },
        },
      })
    : await prisma.visit.findFirst({
        where: {
          clientId,
          tenantId,
          ...(propertyId ? { propertyId } : {}),
        },
        include: {
          property: {
            select: { name: true, type: true, surface: true, rooms: true, price: true, project: { select: { name: true, address: true } } },
          },
          agent: { select: { firstName: true, lastName: true, phone: true } },
        },
        orderBy: { scheduledAt: "desc" },
      });

  const tenantName = tenant?.name ?? "CRM IMMO PRO X";

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>${baseStyles()}</style></head><body>
    ${docHeader(tenantName, "Fiche de Visite", visit?.scheduledAt ?? new Date())}

    <div class="section">
      <div class="section-title">Client</div>
      <div class="row"><span class="label">Nom complet</span><span class="value">${client.firstName} ${client.lastName}</span></div>
      <div class="row"><span class="label">Téléphone</span><span class="value">${client.phone}</span></div>
      ${client.budgetMin || client.budgetMax ? `<div class="row"><span class="label">Budget</span><span class="value">${client.budgetMin ? formatPrice(Number(client.budgetMin)) : "?"} — ${client.budgetMax ? formatPrice(Number(client.budgetMax)) : "?"}</span></div>` : ""}
    </div>

    ${
      visit?.property
        ? `<div class="section">
      <div class="section-title">Bien visité</div>
      <div class="row"><span class="label">Désignation</span><span class="value">${visit.property.name}</span></div>
      <div class="row"><span class="label">Type</span><span class="value">${visit.property.type}</span></div>
      ${visit.property.surface ? `<div class="row"><span class="label">Surface</span><span class="value">${visit.property.surface} m²</span></div>` : ""}
      ${visit.property.rooms ? `<div class="row"><span class="label">Pièces</span><span class="value">${visit.property.rooms}</span></div>` : ""}
      ${visit.property.price ? `<div class="row"><span class="label">Prix</span><span class="value">${formatPrice(Number(visit.property.price))}</span></div>` : ""}
      ${visit.property.project ? `<div class="row"><span class="label">Projet</span><span class="value">${visit.property.project.name}${visit.property.project.address ? ` — ${visit.property.project.address}` : ""}</span></div>` : ""}
    </div>`
        : ""
    }

    <div class="section">
      <div class="section-title">Détails de la visite</div>
      <div class="row"><span class="label">Date</span><span class="value">${visit ? formatDate(visit.scheduledAt) : "Non programmée"}</span></div>
      <div class="row"><span class="label">Statut</span><span class="value">${visit?.status ?? "—"}</span></div>
      ${visit?.agent ? `<div class="row"><span class="label">Agent</span><span class="value">${visit.agent.firstName} ${visit.agent.lastName} (${visit.agent.phone ?? ""})</span></div>` : ""}
    </div>

    <div class="section">
      <div class="section-title">Observations</div>
      <div style="border:1px solid #e2e8f0;border-radius:6px;padding:12px;min-height:100px;font-size:13px;color:#64748b">
        ${visit?.feedback ?? "À compléter après la visite..."}
      </div>
    </div>

    <div class="signature-block">
      <div class="signature-box"><div class="signature-line">Le client</div></div>
      <div class="signature-box"><div class="signature-line">L'agent</div></div>
    </div>

    ${docFooter(tenantName)}
  </body></html>`;
}

// ============================================================================
// COMPROMIS DE VENTE
// ============================================================================

async function buildCompromisVente(
  tenantId: string,
  clientId: string,
  propertyId?: string,
): Promise<string> {
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
          name: true,
          type: true,
          surface: true,
          rooms: true,
          floor: true,
          price: true,
          cadastralRef: true,
          lotNumber: true,
          titleDeedNumber: true,
          project: { select: { name: true, address: true, wilaya: true } },
        },
      })
    : null;

  // Tableau paiements
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

  const paymentRows = payments
    .map(
      (p) =>
        `<tr>
      <td>${typeLabels[p.type] ?? p.type}</td>
      <td style="text-align:right;font-weight:600">${formatPrice(Number(p.amount))}</td>
      <td>${formatDate(p.createdAt)}</td>
      <td>${p.status === "COMPLETED" ? "Payé" : p.status === "PENDING" ? "En attente" : p.status}</td>
    </tr>`,
    )
    .join("");

  const tenantName = tenant?.name ?? "CRM IMMO PRO X";

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>${baseStyles()}</style></head><body>
    ${docHeader(tenantName, "Compromis de Vente", new Date())}

    <div class="section">
      <div class="section-title">Le vendeur</div>
      <div class="row"><span class="label">Société</span><span class="value">${tenantName}</span></div>
    </div>

    <div class="section">
      <div class="section-title">L'acquéreur</div>
      <div class="row"><span class="label">Nom complet</span><span class="value">${client.firstName} ${client.lastName}</span></div>
      <div class="row"><span class="label">Téléphone</span><span class="value">${client.phone}</span></div>
      ${client.email ? `<div class="row"><span class="label">Email</span><span class="value">${client.email}</span></div>` : ""}
    </div>

    ${
      property
        ? `<div class="section">
      <div class="section-title">Objet de la vente</div>
      <div class="row"><span class="label">Désignation</span><span class="value">${property.name}</span></div>
      <div class="row"><span class="label">Type</span><span class="value">${property.type}</span></div>
      ${property.surface ? `<div class="row"><span class="label">Surface</span><span class="value">${property.surface} m²</span></div>` : ""}
      ${property.rooms ? `<div class="row"><span class="label">Pièces</span><span class="value">${property.rooms}</span></div>` : ""}
      ${property.floor !== null && property.floor !== undefined ? `<div class="row"><span class="label">Étage</span><span class="value">${property.floor}</span></div>` : ""}
      ${property.price ? `<div class="row"><span class="label">Prix de vente</span><span class="value" style="font-size:16px">${formatPrice(Number(property.price))}</span></div>` : ""}
      ${property.cadastralRef ? `<div class="row"><span class="label">Réf. cadastrale</span><span class="value">${property.cadastralRef}</span></div>` : ""}
      ${property.lotNumber ? `<div class="row"><span class="label">N° de lot</span><span class="value">${property.lotNumber}</span></div>` : ""}
      ${property.titleDeedNumber ? `<div class="row"><span class="label">N° acte</span><span class="value">${property.titleDeedNumber}</span></div>` : ""}
      ${property.project ? `<div class="row"><span class="label">Projet</span><span class="value">${property.project.name}${property.project.address ? ` — ${property.project.address}` : ""}${property.project.wilaya ? `, ${property.project.wilaya}` : ""}</span></div>` : ""}
    </div>`
        : ""
    }

    ${
      payments.length > 0
        ? `<div class="section">
      <div class="section-title">Conditions financières</div>
      <table>
        <thead><tr><th>Type</th><th style="text-align:right">Montant</th><th>Date</th><th>Statut</th></tr></thead>
        <tbody>${paymentRows}</tbody>
      </table>
    </div>`
        : ""
    }

    <div class="section">
      <div class="section-title">Conditions particulières</div>
      <div style="border:1px solid #e2e8f0;border-radius:6px;padding:12px;min-height:80px;font-size:13px;color:#64748b">
        À compléter...
      </div>
    </div>

    <p style="font-size:12px;color:#64748b;margin:20px 0">
      Fait en deux exemplaires originaux, à ________________, le ${formatDate(new Date())}.
    </p>

    <div class="signature-block">
      <div class="signature-box"><div class="signature-line">L'acquéreur</div></div>
      <div class="signature-box"><div class="signature-line">Le vendeur</div></div>
    </div>

    ${docFooter(tenantName)}
  </body></html>`;
}

// ============================================================================
// BON DE COMMANDE
// ============================================================================

async function buildBonCommande(
  tenantId: string,
  clientId: string,
  propertyId?: string,
): Promise<string> {
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
          name: true,
          type: true,
          surface: true,
          rooms: true,
          floor: true,
          price: true,
          project: { select: { name: true, address: true } },
        },
      })
    : null;

  const tenantName = tenant?.name ?? "CRM IMMO PRO X";

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>${baseStyles()}</style></head><body>
    ${docHeader(tenantName, "Bon de Commande", new Date())}

    <div class="section">
      <div class="section-title">Commanditaire</div>
      <div class="row"><span class="label">Nom complet</span><span class="value">${client.firstName} ${client.lastName}</span></div>
      <div class="row"><span class="label">Téléphone</span><span class="value">${client.phone}</span></div>
      ${client.email ? `<div class="row"><span class="label">Email</span><span class="value">${client.email}</span></div>` : ""}
    </div>

    ${
      property
        ? `<div class="section">
      <div class="section-title">Bien commandé</div>
      <div class="row"><span class="label">Désignation</span><span class="value">${property.name}</span></div>
      <div class="row"><span class="label">Type</span><span class="value">${property.type}</span></div>
      ${property.surface ? `<div class="row"><span class="label">Surface</span><span class="value">${property.surface} m²</span></div>` : ""}
      ${property.rooms ? `<div class="row"><span class="label">Pièces</span><span class="value">${property.rooms}</span></div>` : ""}
      ${property.floor !== null && property.floor !== undefined ? `<div class="row"><span class="label">Étage</span><span class="value">${property.floor}</span></div>` : ""}
      ${property.price ? `<div class="row"><span class="label">Prix</span><span class="value">${formatPrice(Number(property.price))}</span></div>` : ""}
      ${property.project ? `<div class="row"><span class="label">Projet</span><span class="value">${property.project.name}${property.project.address ? ` — ${property.project.address}` : ""}</span></div>` : ""}
    </div>`
        : ""
    }

    <div class="section">
      <div class="section-title">Options et personnalisations</div>
      <div style="border:1px solid #e2e8f0;border-radius:6px;padding:12px;min-height:80px;font-size:13px;color:#64748b">
        À compléter selon les choix du client...
      </div>
    </div>

    <div class="section">
      <div class="section-title">Conditions</div>
      <p style="font-size:12px;color:#64748b">Ce bon de commande engage le commanditaire à l'acquisition du bien désigné ci-dessus aux conditions convenues. Tout acompte versé sera déduit du prix total.</p>
    </div>

    <div class="signature-block">
      <div class="signature-box"><div class="signature-line">Le commanditaire</div></div>
      <div class="signature-box"><div class="signature-line">Le vendeur</div></div>
    </div>

    ${docFooter(tenantName)}
  </body></html>`;
}

// ============================================================================
// ÉTAT DES LIEUX
// ============================================================================

async function buildEtatDesLieux(
  tenantId: string,
  clientId: string,
  propertyId?: string,
): Promise<string> {
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
          name: true,
          type: true,
          surface: true,
          rooms: true,
          floor: true,
          project: { select: { name: true, address: true } },
        },
      })
    : null;

  const rooms = property?.rooms ?? 3;
  const roomRows = Array.from({ length: rooms }, (_, i) => {
    const label = i === 0 ? "Entrée / Séjour" : i === rooms - 1 ? "Cuisine / SDB" : `Pièce ${i + 1}`;
    return `<tr>
      <td>${label}</td>
      <td style="text-align:center">☐ Bon ☐ Moyen ☐ Mauvais</td>
      <td style="text-align:center">☐ Bon ☐ Moyen ☐ Mauvais</td>
      <td></td>
    </tr>`;
  }).join("");

  const tenantName = tenant?.name ?? "CRM IMMO PRO X";

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>${baseStyles()}</style></head><body>
    ${docHeader(tenantName, "État des Lieux", new Date())}

    <div class="section">
      <div class="section-title">Locataire / Acquéreur</div>
      <div class="row"><span class="label">Nom complet</span><span class="value">${client.firstName} ${client.lastName}</span></div>
      <div class="row"><span class="label">Téléphone</span><span class="value">${client.phone}</span></div>
    </div>

    ${
      property
        ? `<div class="section">
      <div class="section-title">Bien concerné</div>
      <div class="row"><span class="label">Désignation</span><span class="value">${property.name}</span></div>
      <div class="row"><span class="label">Type</span><span class="value">${property.type}</span></div>
      ${property.surface ? `<div class="row"><span class="label">Surface</span><span class="value">${property.surface} m²</span></div>` : ""}
      ${property.rooms ? `<div class="row"><span class="label">Pièces</span><span class="value">${property.rooms}</span></div>` : ""}
      ${property.floor !== null && property.floor !== undefined ? `<div class="row"><span class="label">Étage</span><span class="value">${property.floor}</span></div>` : ""}
      ${property.project ? `<div class="row"><span class="label">Adresse</span><span class="value">${property.project.name}${property.project.address ? ` — ${property.project.address}` : ""}</span></div>` : ""}
    </div>`
        : ""
    }

    <div class="section">
      <div class="section-title">Constat par pièce</div>
      <table>
        <thead>
          <tr><th>Pièce</th><th style="text-align:center">Murs / Sol</th><th style="text-align:center">Plomberie / Élec.</th><th>Observations</th></tr>
        </thead>
        <tbody>${roomRows}</tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Relevés compteurs</div>
      <div class="row"><span class="label">Électricité</span><span class="value">_______________</span></div>
      <div class="row"><span class="label">Gaz</span><span class="value">_______________</span></div>
      <div class="row"><span class="label">Eau</span><span class="value">_______________</span></div>
    </div>

    <div class="section">
      <div class="section-title">Observations générales</div>
      <div style="border:1px solid #e2e8f0;border-radius:6px;padding:12px;min-height:80px;font-size:13px;color:#64748b">
        À compléter...
      </div>
    </div>

    <div class="signature-block">
      <div class="signature-box"><div class="signature-line">Le locataire / acquéreur</div></div>
      <div class="signature-box"><div class="signature-line">Le bailleur / vendeur</div></div>
    </div>

    ${docFooter(tenantName)}
  </body></html>`;
}

// ============================================================================
// CONTRAT DE LOCATION
// ============================================================================

async function buildContratLocation(
  tenantId: string,
  clientId: string,
  propertyId?: string,
): Promise<string> {
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
          name: true,
          type: true,
          surface: true,
          rooms: true,
          floor: true,
          price: true,
          project: { select: { name: true, address: true, wilaya: true } },
        },
      })
    : null;

  const monthlyRent = property?.price ? formatPrice(Number(property.price)) : "_______________";
  const tenantName = tenant?.name ?? "CRM IMMO PRO X";

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>${baseStyles()}</style></head><body>
    ${docHeader(tenantName, "Contrat de Location", new Date())}

    <div class="section">
      <div class="section-title">Le bailleur</div>
      <div class="row"><span class="label">Société / Nom</span><span class="value">${tenantName}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Le locataire</div>
      <div class="row"><span class="label">Nom complet</span><span class="value">${client.firstName} ${client.lastName}</span></div>
      <div class="row"><span class="label">Téléphone</span><span class="value">${client.phone}</span></div>
      ${client.email ? `<div class="row"><span class="label">Email</span><span class="value">${client.email}</span></div>` : ""}
    </div>

    ${
      property
        ? `<div class="section">
      <div class="section-title">Objet de la location</div>
      <div class="row"><span class="label">Désignation</span><span class="value">${property.name}</span></div>
      <div class="row"><span class="label">Type</span><span class="value">${property.type}</span></div>
      ${property.surface ? `<div class="row"><span class="label">Surface</span><span class="value">${property.surface} m²</span></div>` : ""}
      ${property.rooms ? `<div class="row"><span class="label">Pièces</span><span class="value">${property.rooms}</span></div>` : ""}
      ${property.floor !== null && property.floor !== undefined ? `<div class="row"><span class="label">Étage</span><span class="value">${property.floor}</span></div>` : ""}
      ${property.project ? `<div class="row"><span class="label">Adresse</span><span class="value">${property.project.name}${property.project.address ? ` — ${property.project.address}` : ""}${property.project.wilaya ? `, ${property.project.wilaya}` : ""}</span></div>` : ""}
    </div>`
        : ""
    }

    <div class="section">
      <div class="section-title">Conditions financières</div>
      <div class="row"><span class="label">Loyer mensuel</span><span class="value" style="font-size:16px">${monthlyRent}</span></div>
      <div class="row"><span class="label">Caution</span><span class="value">_______________</span></div>
      <div class="row"><span class="label">Charges</span><span class="value">☐ Incluses ☐ En sus</span></div>
      <div class="row"><span class="label">Paiement le</span><span class="value">______ de chaque mois</span></div>
    </div>

    <div class="section">
      <div class="section-title">Durée</div>
      <div class="row"><span class="label">Date de début</span><span class="value">_______________</span></div>
      <div class="row"><span class="label">Durée</span><span class="value">☐ 1 an ☐ 2 ans ☐ 3 ans ☐ Autre : ___</span></div>
      <div class="row"><span class="label">Renouvellement</span><span class="value">☐ Tacite reconduction ☐ Non renouvelable</span></div>
    </div>

    <div class="section">
      <div class="section-title">Clauses particulières</div>
      <div style="border:1px solid #e2e8f0;border-radius:6px;padding:12px;min-height:80px;font-size:13px;color:#64748b">
        À compléter...
      </div>
    </div>

    <p style="font-size:12px;color:#64748b;margin:20px 0">
      Fait en deux exemplaires originaux, à ________________, le ${formatDate(new Date())}.
    </p>

    <div class="signature-block">
      <div class="signature-box"><div class="signature-line">Le locataire</div></div>
      <div class="signature-box"><div class="signature-line">Le bailleur</div></div>
    </div>

    ${docFooter(tenantName)}
  </body></html>`;
}

// ============================================================================
// API publique
// ============================================================================

/**
 * Génère un document PDF selon le type demandé.
 * Retourne un Buffer PDF.
 */
export async function generateDocument(input: IDocumentInput): Promise<Buffer> {
  let html: string;

  switch (input.type) {
    case "BON_RESERVATION":
      html = await buildBonReservation(input.tenantId, input.clientId, input.propertyId);
      break;
    case "RECU_PAIEMENT":
      html = await buildRecuPaiement(input.tenantId, input.clientId, input.paymentId);
      break;
    case "FICHE_VISITE":
      html = await buildFicheVisite(input.tenantId, input.clientId, input.propertyId, input.visitId);
      break;
    case "COMPROMIS_VENTE":
      html = await buildCompromisVente(input.tenantId, input.clientId, input.propertyId);
      break;
    case "BON_COMMANDE":
      html = await buildBonCommande(input.tenantId, input.clientId, input.propertyId);
      break;
    case "ETAT_DES_LIEUX":
      html = await buildEtatDesLieux(input.tenantId, input.clientId, input.propertyId);
      break;
    case "CONTRAT_LOCATION":
      html = await buildContratLocation(input.tenantId, input.clientId, input.propertyId);
      break;
    default:
      throw new Error(`Type de document inconnu : ${input.type}`);
  }

  return htmlToPdf(html);
}
