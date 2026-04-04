"use client";

import { useState } from "react";
import {
  FileText,
  ClipboardCheck,
  Receipt,
  MapPin,
  FileSignature,
  Loader2,
  Download,
  ArrowLeft,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface DocType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface GeneratedDoc {
  html: string;
  fileName: string;
}

const DOC_TYPES: DocType[] = [
  {
    id: "BON_RESERVATION",
    title: "Bon de reservation",
    description: "Generez un bon de reservation pour un client et un lot",
    icon: <ClipboardCheck className="h-8 w-8" />,
  },
  {
    id: "RECU_PAIEMENT",
    title: "Recu de paiement",
    description: "Generez un recu de paiement pour une transaction",
    icon: <Receipt className="h-8 w-8" />,
  },
  {
    id: "FICHE_VISITE",
    title: "Fiche visite",
    description: "Generez une fiche recapitulative de visite",
    icon: <MapPin className="h-8 w-8" />,
  },
  {
    id: "COMPROMIS_VENTE",
    title: "Compromis de vente",
    description: "Generez un compromis de vente pre-rempli",
    icon: <FileSignature className="h-8 w-8" />,
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function DocumentsPage() {
  const [selectedType, setSelectedType] = useState<DocType | null>(null);
  const [clientId, setClientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedDoc | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !clientId.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const res = await fetch("/api/v1/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType.id,
          clientId: clientId.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setResult(json.data);
      } else {
        setError(json.error ?? "Erreur lors de la generation du document");
      }
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedType(null);
    setClientId("");
    setResult(null);
    setError(null);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <FileText className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase">
            Documents
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Generez et telechargez vos documents immobiliers
          </p>
        </div>
      </div>

      {/* Document type selection grid */}
      {!selectedType && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DOC_TYPES.map((doc) => (
            <Card
              key={doc.id}
              className="cursor-pointer transition-all hover:ring-2 hover:ring-primary/30"
              onClick={() => setSelectedType(doc)}
            >
              <CardContent className="flex flex-col items-center text-center gap-3 py-8">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  {doc.icon}
                </div>
                <h3 className="font-semibold">{doc.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {doc.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form + result */}
      {selectedType && (
        <div className="space-y-4">
          <Button variant="ghost" className="gap-1.5" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedType.icon}
                {selectedType.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="doc-client">ID Client</Label>
                  <Input
                    id="doc-client"
                    placeholder="Entrez l'identifiant du client"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="gap-2"
                  disabled={loading || !clientId.trim()}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {loading ? "Generation..." : "Generer le document"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <Card className="border-red-300 dark:border-red-500/30">
              <CardContent className="flex items-center gap-3 py-6 text-sm text-red-600 dark:text-red-400">
                <XCircle className="h-5 w-5 shrink-0" />
                {error}
              </CardContent>
            </Card>
          )}

          {/* Result */}
          {result && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle>Document genere</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleDownload}
                >
                  <Download className="h-3.5 w-3.5" />
                  Telecharger ({result.fileName})
                </Button>
              </CardHeader>
              <CardContent>
                <div
                  className="rounded-lg border bg-white p-6 text-sm dark:bg-muted/20"
                  dangerouslySetInnerHTML={{ __html: result.html }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
