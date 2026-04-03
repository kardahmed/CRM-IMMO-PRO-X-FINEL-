"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// ============================================================================
// Types
// ============================================================================

interface IPortalData {
  client: {
    firstName: string;
    lastName: string;
    pipelineStage: string;
  };
  property: {
    name: string;
    type: string;
    floor: number | null;
    rooms: number | null;
    surface: number | null;
    price: number | null;
    status: string;
    images: string[];
    plans: string[];
    documents: string[];
  } | null;
  project: {
    name: string;
    address: string | null;
    wilaya: string | null;
    deliveryDate: string | null;
    progressPercentage: number;
    status: string;
  } | null;
  payments: {
    items: Array<{
      id: string;
      type: string;
      amount: number;
      status: string;
      date: string;
    }>;
    totalAmount: number;
    paidAmount: number;
    progressPercent: number;
  };
  agent: {
    name: string;
    phone: string | null;
    email: string | null;
  } | null;
}

// ============================================================================
// Helpers
// ============================================================================

const STAGE_LABELS: Record<string, string> = {
  RESERVED: "Bien reservé",
  SIGNED: "Acte signé",
  CLOSED: "Transaction finalisée",
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  RESERVATION: "Réservation",
  INSTALLMENT: "Tranche",
  FINAL: "Solde final",
  COMMISSION: "Commission",
  REFUND: "Remboursement",
};

const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  COMPLETED: { label: "Payé", color: "bg-green-100 text-green-800" },
  FAILED: { label: "Échoué", color: "bg-red-100 text-red-800" },
  REFUNDED: { label: "Remboursé", color: "bg-gray-100 text-gray-800" },
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
  PLANNING: "En planification",
  IN_PROGRESS: "En construction",
  DELIVERED: "Livré",
  CANCELLED: "Annulé",
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-DZ", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(price) + " DA";
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ============================================================================
// Components
// ============================================================================

function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div className={`h-3 w-full overflow-hidden rounded-full bg-gray-200 ${className ?? ""}`}>
      <div
        className="h-full rounded-full bg-blue-600 transition-all duration-500"
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 border-b border-gray-200 pb-2 text-lg font-semibold text-gray-800">
      {children}
    </h2>
  );
}

function PropertySection({ property }: { property: IPortalData["property"] }) {
  if (!property) return null;

  const images = Array.isArray(property.images) ? property.images : [];
  const plans = Array.isArray(property.plans) ? property.plans : [];

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <SectionTitle>Votre bien</SectionTitle>

      {/* Images */}
      {images.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {(images as string[]).map((img, i) => (
            <Image
              key={i}
              src={img}
              alt={`Photo ${i + 1}`}
              width={320}
              height={192}
              className="h-48 w-auto rounded-lg object-cover"
              unoptimized
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div>
          <span className="text-gray-500">Nom</span>
          <p className="font-medium">{property.name}</p>
        </div>
        <div>
          <span className="text-gray-500">Type</span>
          <p className="font-medium">{property.type}</p>
        </div>
        {property.rooms && (
          <div>
            <span className="text-gray-500">Pièces</span>
            <p className="font-medium">{property.rooms}</p>
          </div>
        )}
        {property.surface && (
          <div>
            <span className="text-gray-500">Surface</span>
            <p className="font-medium">{property.surface} m²</p>
          </div>
        )}
        {property.floor !== null && (
          <div>
            <span className="text-gray-500">Étage</span>
            <p className="font-medium">{property.floor}</p>
          </div>
        )}
        {property.price && (
          <div>
            <span className="text-gray-500">Prix</span>
            <p className="font-medium text-blue-700">{formatPrice(property.price)}</p>
          </div>
        )}
      </div>

      {/* Plans */}
      {plans.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-medium text-gray-500">Plans</h3>
          <div className="flex gap-2 overflow-x-auto">
            {(plans as string[]).map((plan, i) => (
              <Image
                key={i}
                src={plan}
                alt={`Plan ${i + 1}`}
                width={256}
                height={144}
                className="h-36 w-auto rounded-lg border object-contain"
                unoptimized
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ProjectSection({ project }: { project: IPortalData["project"] }) {
  if (!project) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <SectionTitle>Avancement du chantier</SectionTitle>

      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-medium">{project.name}</span>
          <span className="font-semibold text-blue-700">
            {project.progressPercentage}%
          </span>
        </div>
        <ProgressBar percent={project.progressPercentage} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500">Statut</span>
          <p className="font-medium">
            {PROJECT_STATUS_LABELS[project.status] ?? project.status}
          </p>
        </div>
        {project.address && (
          <div>
            <span className="text-gray-500">Adresse</span>
            <p className="font-medium">{project.address}</p>
          </div>
        )}
        {project.wilaya && (
          <div>
            <span className="text-gray-500">Wilaya</span>
            <p className="font-medium">{project.wilaya}</p>
          </div>
        )}
        {project.deliveryDate && (
          <div>
            <span className="text-gray-500">Livraison prévue</span>
            <p className="font-medium">{formatDate(project.deliveryDate)}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function PaymentsSection({ payments }: { payments: IPortalData["payments"] }) {
  if (payments.items.length === 0) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <SectionTitle>Paiements</SectionTitle>

      {/* Progression globale */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {formatPrice(payments.paidAmount)} / {formatPrice(payments.totalAmount)}
          </span>
          <span className="font-semibold text-blue-700">
            {payments.progressPercent}%
          </span>
        </div>
        <ProgressBar percent={payments.progressPercent} />
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="pb-2 font-medium">Type</th>
              <th className="pb-2 font-medium">Montant</th>
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {payments.items.map((p) => {
              const statusInfo = PAYMENT_STATUS_LABELS[p.status] ?? {
                label: p.status,
                color: "bg-gray-100 text-gray-800",
              };
              return (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="py-2">
                    {PAYMENT_TYPE_LABELS[p.type] ?? p.type}
                  </td>
                  <td className="py-2 font-medium">{formatPrice(p.amount)}</td>
                  <td className="py-2 text-gray-500">{formatDate(p.date)}</td>
                  <td className="py-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CreditSimulator({ propertyPrice }: { propertyPrice: number | null }) {
  const defaultPrice = propertyPrice ?? 10_000_000;
  const [totalPrice, setTotalPrice] = useState(defaultPrice);
  const [downPayment, setDownPayment] = useState(Math.round(defaultPrice * 0.2));
  const [rate, setRate] = useState(6.5); // Taux annuel %
  const [duration, setDuration] = useState(20); // Années

  // Formule mensualité crédit : M = P * [r(1+r)^n] / [(1+r)^n - 1]
  const loanAmount = Math.max(totalPrice - downPayment, 0);
  const monthlyRate = rate / 100 / 12;
  const numberOfPayments = duration * 12;

  let monthlyPayment = 0;
  let totalCost = 0;
  let totalInterest = 0;

  if (loanAmount > 0 && monthlyRate > 0 && numberOfPayments > 0) {
    const factor = Math.pow(1 + monthlyRate, numberOfPayments);
    monthlyPayment = loanAmount * (monthlyRate * factor) / (factor - 1);
    totalCost = monthlyPayment * numberOfPayments;
    totalInterest = totalCost - loanAmount;
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <SectionTitle>Simulateur de crédit</SectionTitle>
      <p className="mb-4 text-xs text-gray-400">
        Simulation indicative. Consultez votre banque pour une offre personnalisée.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Prix total */}
        <div>
          <label className="mb-1 block text-sm text-gray-500">Prix du bien (DA)</label>
          <input
            type="number"
            value={totalPrice}
            onChange={(e) => setTotalPrice(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            min={0}
            step={100000}
          />
        </div>

        {/* Apport personnel */}
        <div>
          <label className="mb-1 block text-sm text-gray-500">Apport personnel (DA)</label>
          <input
            type="number"
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            min={0}
            max={totalPrice}
            step={100000}
          />
          <p className="mt-1 text-xs text-gray-400">
            {totalPrice > 0 ? Math.round((downPayment / totalPrice) * 100) : 0}% du prix
          </p>
        </div>

        {/* Taux d'intérêt */}
        <div>
          <label className="mb-1 block text-sm text-gray-500">Taux annuel (%)</label>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            min={0.1}
            max={30}
            step={0.1}
          />
        </div>

        {/* Durée */}
        <div>
          <label className="mb-1 block text-sm text-gray-500">Durée (années)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            min={1}
            max={35}
            step={1}
          />
        </div>
      </div>

      {/* Résultat */}
      {loanAmount > 0 && (
        <div className="mt-5 rounded-lg bg-blue-50 p-4">
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="text-center">
              <p className="text-gray-500">Mensualité</p>
              <p className="text-xl font-bold text-blue-700">
                {formatPrice(Math.round(monthlyPayment))}
              </p>
              <p className="text-xs text-gray-400">/mois</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">Montant emprunté</p>
              <p className="text-lg font-semibold text-gray-800">
                {formatPrice(loanAmount)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">Coût total du crédit</p>
              <p className="text-lg font-semibold text-gray-800">
                {formatPrice(Math.round(totalCost))}
              </p>
              <p className="text-xs text-red-500">
                dont {formatPrice(Math.round(totalInterest))} d&apos;intérêts
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function DocumentsSection({ documents }: { documents: string[] }) {
  if (!documents || documents.length === 0) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <SectionTitle>Documents</SectionTitle>
      <ul className="space-y-2">
        {documents.map((doc, i) => (
          <li key={i}>
            <a
              href={doc}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Document {i + 1}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AgentSection({ agent }: { agent: IPortalData["agent"] }) {
  if (!agent) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <SectionTitle>Votre contact</SectionTitle>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
          {agent.name.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-gray-800">{agent.name}</p>
          {agent.phone && (
            <a href={`tel:${agent.phone}`} className="text-sm text-blue-600 hover:underline">
              {agent.phone}
            </a>
          )}
          {agent.email && (
            <p>
              <a href={`mailto:${agent.email}`} className="text-sm text-blue-600 hover:underline">
                {agent.email}
              </a>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Page principale
// ============================================================================

export default function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [data, setData] = useState<IPortalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ token }) => {
      fetch(`/api/v1/portal/${token}`)
        .then((res) => res.json())
        .then((json: { success: boolean; data?: IPortalData; error?: string }) => {
          if (json.success && json.data) {
            setData(json.data);
          } else {
            setError(json.error ?? "Portail introuvable");
          }
        })
        .catch(() => {
          setError("Erreur de connexion");
        })
        .finally(() => {
          setLoading(false);
        });
    });
  }, [params]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-gray-500">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="mb-2 text-xl font-bold text-red-700">Accès impossible</h1>
          <p className="text-gray-600">{error ?? "Lien invalide ou expiré."}</p>
        </div>
      </div>
    );
  }

  const documents = data.property
    ? (Array.isArray(data.property.documents) ? data.property.documents as string[] : [])
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <p className="text-sm text-gray-500">Espace client</p>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour {data.client.firstName} {data.client.lastName}
          </h1>
          <p className="mt-1 text-sm text-blue-600">
            {STAGE_LABELS[data.client.pipelineStage] ?? data.client.pipelineStage}
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <PropertySection property={data.property} />
        <ProjectSection project={data.project} />
        <PaymentsSection payments={data.payments} />
        <CreditSimulator propertyPrice={data.property?.price ?? null} />
        <DocumentsSection documents={documents} />
        <AgentSection agent={data.agent} />
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-4 text-center text-xs text-gray-400">
        CRM IMMO PRO X — Portail client en lecture seule
      </footer>
    </div>
  );
}
