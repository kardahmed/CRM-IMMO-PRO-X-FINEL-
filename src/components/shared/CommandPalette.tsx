"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Kanban,
  Users,
  Calendar,
  Bell,
  Building2,
  HardHat,
  Grid3X3,
  Banknote,
  Home,
  UserCheck,
  FileSignature,
  Percent,
  ArrowLeftRight,
  Zap,
  Sparkles,
  Map,
  MapPin,
  Globe,
  TrendingUp,
  FileText,
  Target,
  Settings,
  ScrollText,
  Search,
  UserPlus,
  ListTodo,
  Command,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

// ============================================================================
// Icon mapping (matches navigation.ts icon strings to Lucide components)
// ============================================================================

const ICON_MAP: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  kanban: Kanban,
  users: Users,
  calendar: Calendar,
  bell: Bell,
  "building-2": Building2,
  "hard-hat": HardHat,
  "grid-3x3": Grid3X3,
  banknote: Banknote,
  home: Home,
  "user-check": UserCheck,
  "file-signature": FileSignature,
  percent: Percent,
  "arrow-left-right": ArrowLeftRight,
  zap: Zap,
  sparkles: Sparkles,
  map: Map,
  "map-pin": MapPin,
  globe: Globe,
  "trending-up": TrendingUp,
  "file-text": FileText,
  target: Target,
  settings: Settings,
  "scroll-text": ScrollText,
};

// ============================================================================
// Static data for the palette
// ============================================================================

interface ICommandItem {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  href: string;
  group: "pages" | "actions";
}

const PAGE_ITEMS: ICommandItem[] = [
  { id: "dashboard", label: "Tableau de bord", description: "Vue d'ensemble de l'activite", icon: LayoutDashboard, href: "/dashboard", group: "pages" },
  { id: "pipeline", label: "Pipeline", description: "Suivi des opportunites de vente", icon: Kanban, href: "/pipeline", group: "pages" },
  { id: "clients", label: "Clients", description: "Gestion des clients et leads", icon: Users, href: "/clients", group: "pages" },
  { id: "planning", label: "Planning", description: "Calendrier et rendez-vous", icon: Calendar, href: "/planning", group: "pages" },
  { id: "notifications", label: "Notifications", description: "Centre de notifications", icon: Bell, href: "/notifications", group: "pages" },
  { id: "projects", label: "Programmes", description: "Gestion des programmes neufs", icon: Building2, href: "/projects", group: "pages" },
  { id: "construction", label: "Avancement", description: "Suivi de l'avancement chantier", icon: HardHat, href: "/construction", group: "pages" },
  { id: "availability", label: "Disponibilite", description: "Grille de disponibilite des lots", icon: Grid3X3, href: "/availability", group: "pages" },
  { id: "payments", label: "Echeancier", description: "Suivi des paiements", icon: Banknote, href: "/payments", group: "pages" },
  { id: "portfolio", label: "Portefeuille", description: "Biens immobiliers en portefeuille", icon: Home, href: "/portfolio", group: "pages" },
  { id: "owners", label: "Proprietaires", description: "Gestion des proprietaires", icon: UserCheck, href: "/owners", group: "pages" },
  { id: "mandates", label: "Mandats", description: "Gestion des mandats", icon: FileSignature, href: "/mandates", group: "pages" },
  { id: "commissions", label: "Commissions", description: "Suivi des commissions", icon: Percent, href: "/commissions", group: "pages" },
  { id: "automations", label: "Automatisations", description: "Regles et automatisations", icon: Zap, href: "/automations", group: "pages" },
  { id: "ai-agent", label: "Assistant IA", description: "Assistant intelligent", icon: Sparkles, href: "/ai", group: "pages" },
  { id: "geomap", label: "Carte", description: "Vue cartographique", icon: Map, href: "/map", group: "pages" },
  { id: "documents", label: "Documents", description: "Gestion documentaire", icon: FileText, href: "/documents", group: "pages" },
  { id: "objectives", label: "Objectifs", description: "Suivi des objectifs", icon: Target, href: "/objectives", group: "pages" },
  { id: "performance", label: "Performance", description: "Tableaux de performance", icon: TrendingUp, href: "/performance", group: "pages" },
  { id: "settings", label: "Parametres", description: "Configuration du workspace", icon: Settings, href: "/settings", group: "pages" },
];

const ACTION_ITEMS: ICommandItem[] = [
  { id: "new-client", label: "Nouveau client", description: "Creer un nouveau client ou lead", icon: UserPlus, href: "/clients?action=new", group: "actions" },
  { id: "new-task", label: "Nouvelle tache", description: "Creer une nouvelle tache", icon: ListTodo, href: "/planning?action=new", group: "actions" },
  { id: "go-pipeline", label: "Pipeline", description: "Acceder au pipeline de vente", icon: Kanban, href: "/pipeline", group: "actions" },
  { id: "search-client", label: "Rechercher un client", description: "Trouver un client par nom ou telephone", icon: Search, href: "/clients?focus=search", group: "actions" },
];

const ALL_ITEMS = [...PAGE_ITEMS, ...ACTION_ITEMS];

// ============================================================================
// Component
// ============================================================================

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Keyboard shortcut to open
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      // Small delay to let the dialog render
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Filter items
  const normalizedQuery = query.toLowerCase().trim();
  const filtered = normalizedQuery
    ? ALL_ITEMS.filter(
        (item) =>
          item.label.toLowerCase().includes(normalizedQuery) ||
          item.description.toLowerCase().includes(normalizedQuery)
      )
    : ALL_ITEMS;

  const pageResults = filtered.filter((i) => i.group === "pages");
  const actionResults = filtered.filter((i) => i.group === "actions");
  const flatResults = [...actionResults, ...pageResults];

  // Reset index when filter changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Navigate to item
  function navigateTo(item: ICommandItem) {
    setOpen(false);
    router.push(item.href);
  }

  // Keyboard navigation inside the list
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatResults[selectedIndex];
      if (item) navigateTo(item);
    }
  }

  // Scroll selected item into view
  React.useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector("[data-selected='true']");
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Render a group of items
  function renderGroup(title: string, items: ICommandItem[], indexOffset: number) {
    if (items.length === 0) return null;
    return (
      <div key={title}>
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </div>
        {items.map((item, i) => {
          const globalIndex = indexOffset + i;
          const isSelected = globalIndex === selectedIndex;
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              data-selected={isSelected}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg mx-1 transition-colors cursor-pointer ${
                isSelected
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-accent/50"
              }`}
              style={{ width: "calc(100% - 0.5rem)" }}
              onClick={() => navigateTo(item)}
              onMouseEnter={() => setSelectedIndex(globalIndex)}
            >
              <div
                className={`flex items-center justify-center h-8 w-8 rounded-md shrink-0 ${
                  isSelected ? "bg-primary/15" : "bg-accent"
                }`}
              >
                <IconComponent className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">{item.label}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {item.description}
                </span>
              </div>
              {isSelected && (
                <span className="ml-auto text-xs text-muted-foreground shrink-0">
                  Entree
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogPortal>
        <DialogOverlay className="bg-black/40 backdrop-blur-sm" />
        <DialogPrimitive.Popup
          data-slot="dialog-content"
          className="fixed top-[15%] left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-xl bg-popover text-popover-foreground ring-1 ring-border shadow-2xl outline-none sm:max-w-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 duration-150 overflow-hidden"
        >
          <DialogTitle className="sr-only">Palette de commandes</DialogTitle>

          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher une page ou une action..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
            {flatResults.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Aucun resultat pour &laquo;{query}&raquo;
              </div>
            ) : (
              <>
                {renderGroup("Actions rapides", actionResults, 0)}
                {renderGroup("Pages", pageResults, actionResults.length)}
              </>
            )}
          </div>

          {/* Footer hint */}
          <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">&uarr;</kbd>
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">&darr;</kbd>
              naviguer
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">&crarr;</kbd>
              ouvrir
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">esc</kbd>
              fermer
            </span>
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}

// ============================================================================
// Hint button to show in header/sidebar
// ============================================================================

export function CommandPaletteHint() {
  return (
    <button
      onClick={() => {
        // Dispatch Ctrl+K to open the palette
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "k",
            code: "KeyK",
            ctrlKey: true,
            bubbles: true,
          })
        );
      }}
      className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
    >
      <Search className="h-3.5 w-3.5" />
      <span>Recherche rapide</span>
      <kbd className="ml-1 inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium font-mono">
        <Command className="h-2.5 w-2.5" />K
      </kbd>
    </button>
  );
}
