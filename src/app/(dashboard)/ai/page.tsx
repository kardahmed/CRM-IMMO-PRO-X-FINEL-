"use client";

import { useState } from "react";
import {
  BrainCircuit,
  AlertTriangle,
  Send,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const AI_TYPES = [
  { value: "CLIENT_SUMMARY", label: "Resume client" },
  { value: "PROPERTY_DESCRIPTION", label: "Description bien" },
  { value: "EMAIL_DRAFT", label: "Brouillon email" },
  { value: "SMS_DRAFT", label: "Brouillon SMS" },
  { value: "SCORING", label: "Scoring" },
  { value: "RECOMMENDATION", label: "Recommandation" },
] as const;

const CHANNELS = [
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
  { value: "WHATSAPP", label: "WhatsApp" },
] as const;

interface AiResponse {
  response: string;
  type: string;
  id: string;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AiPage() {
  const [type, setType] = useState<string>("CLIENT_SUMMARY");
  const [channel, setChannel] = useState<string>("EMAIL");
  const [prompt, setPrompt] = useState("");
  const [clientId, setClientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const body: Record<string, string> = { type, channel, prompt };
      if (clientId.trim()) {
        body.clientId = clientId.trim();
      }

      const res = await fetch("/api/v1/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (json.success) {
        setResult(json.data);
      } else {
        setError(json.error ?? "Erreur lors de la generation");
      }
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may not be available
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <BrainCircuit className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase">
            Assistant IA
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Generez du contenu avec l&apos;intelligence artificielle
          </p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-300/50 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-950/20">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-300">
          Les suggestions IA doivent etre validees par un humain avant
          utilisation. Aucune action automatique ne sera appliquee.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle generation</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="ai-type">Type de generation</Label>
                <Select
                  value={type}
                  onValueChange={(v: string | null) => {
                    if (v) setType(v);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Channel */}
              <div className="space-y-2">
                <Label htmlFor="ai-channel">Canal</Label>
                <Select
                  value={channel}
                  onValueChange={(v: string | null) => {
                    if (v) setChannel(v);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selectionnez un canal" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Client ID (optional) */}
              <div className="space-y-2">
                <Label htmlFor="ai-client">
                  ID Client{" "}
                  <span className="text-muted-foreground font-normal">
                    (optionnel)
                  </span>
                </Label>
                <Input
                  id="ai-client"
                  placeholder="ex: cl_abc123..."
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
              </div>

              {/* Prompt */}
              <div className="space-y-2">
                <Label htmlFor="ai-prompt">Votre demande</Label>
                <Textarea
                  id="ai-prompt"
                  placeholder="Decrivez ce que vous souhaitez generer..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-28"
                  required
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full gap-2"
                disabled={loading || !prompt.trim()}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {loading ? "Generation en cours..." : "Generer"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Result */}
        <div className="space-y-4">
          {/* Error */}
          {error && (
            <Card className="border-red-300 dark:border-red-500/30">
              <CardContent className="py-6 text-sm text-red-600 dark:text-red-400">
                {error}
              </CardContent>
            </Card>
          )}

          {/* Loading */}
          {loading && (
            <Card>
              <CardContent className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>L&apos;IA reflechit...</span>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {!loading && !result && !error && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                <BrainCircuit className="h-10 w-10" />
                <p>La reponse de l&apos;IA apparaitra ici</p>
              </CardContent>
            </Card>
          )}

          {/* AI Response */}
          {result && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CardTitle>Reponse IA</CardTitle>
                  <Badge variant="secondary">
                    {AI_TYPES.find((t) => t.value === result.type)?.label ??
                      result.type}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copie !" : "Copier"}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted/50 p-4 text-sm whitespace-pre-wrap leading-relaxed">
                  {result.response}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
