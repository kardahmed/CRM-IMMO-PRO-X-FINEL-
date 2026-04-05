"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, User, Home, Building2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

interface SearchResults {
  clients: Array<{
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    pipelineStage: string;
  }>;
  properties: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    lotNumber: string | null;
  }>;
  projects: Array<{
    id: string;
    name: string;
    address: string | null;
    status: string;
  }>;
}

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const json = await res.json();
        setResults(json.data);
        setOpen(true);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  }

  function navigate(path: string) {
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(path);
  }

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const hasResults =
    results &&
    (results.clients.length > 0 ||
      results.properties.length > 0 ||
      results.projects.length > 0);

  return (
    <div ref={containerRef} className="relative w-full max-w-xl lg:max-w-2xl">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
      <Input
        placeholder="Rechercher (clients, biens, projets...)"
        className="pl-9 bg-accent/20 border-accent/30 focus-visible:ring-primary/50 shadow-inner rounded-xl h-10"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          if (results && query.length >= 2) setOpen(true);
        }}
      />

      {open && results && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-xl shadow-lg z-50 max-h-[400px] overflow-y-auto">
          {!hasResults && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Aucun resultat pour &quot;{query}&quot;
            </div>
          )}

          {results.clients.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-black uppercase text-muted-foreground bg-accent/30">
                Clients
              </div>
              {results.clients.map((c) => (
                <button
                  key={c.id}
                  className="w-full px-3 py-2 flex items-center gap-3 hover:bg-accent/50 transition-colors text-left"
                  onClick={() => navigate(`/clients/${c.id}`)}
                >
                  <User className="h-4 w-4 text-blue-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">
                      {c.firstName} {c.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {results.properties.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-black uppercase text-muted-foreground bg-accent/30">
                Biens
              </div>
              {results.properties.map((p) => (
                <button
                  key={p.id}
                  className="w-full px-3 py-2 flex items-center gap-3 hover:bg-accent/50 transition-colors text-left"
                  onClick={() => navigate(`/properties/${p.id}`)}
                >
                  <Home className="h-4 w-4 text-green-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.type} {p.lotNumber ? `- Lot ${p.lotNumber}` : ""}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {results.projects.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-black uppercase text-muted-foreground bg-accent/30">
                Projets
              </div>
              {results.projects.map((p) => (
                <button
                  key={p.id}
                  className="w-full px-3 py-2 flex items-center gap-3 hover:bg-accent/50 transition-colors text-left"
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <Building2 className="h-4 w-4 text-purple-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.address}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
