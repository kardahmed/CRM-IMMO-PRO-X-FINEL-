"use client";

import { AlertTriangle, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DemoBannerProps {
  expiresAt?: string | null;
}

export function DemoBanner({ expiresAt }: DemoBannerProps) {
  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const isExpiring = daysLeft !== null && daysLeft <= 3;

  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 py-2.5 text-sm font-medium ${
        isExpiring
          ? "bg-amber-500/10 border-b border-amber-500/20 text-amber-300"
          : "bg-indigo-500/10 border-b border-indigo-500/20 text-indigo-300"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isExpiring ? (
          <AlertTriangle className="h-4 w-4 shrink-0" />
        ) : (
          <Clock className="h-4 w-4 shrink-0" />
        )}
        <span className="truncate">
          <span className="font-bold">Version Demo</span>
          {daysLeft !== null && (
            <span className="hidden sm:inline">
              {" "}— {daysLeft === 0
                ? "Expire aujourd\u2019hui"
                : `${daysLeft} jour${daysLeft > 1 ? "s" : ""} restant${daysLeft > 1 ? "s" : ""}`}
            </span>
          )}
          <span className="hidden md:inline text-xs opacity-70 ml-2">
            (5 clients, 3 biens, 1 utilisateur max)
          </span>
        </span>
      </div>
      <a href="mailto:contact@immopro-x.dz" className="shrink-0">
        <Button
          size="sm"
          className={`h-7 text-xs font-bold rounded-full px-3 gap-1 ${
            isExpiring
              ? "bg-amber-500 hover:bg-amber-600 text-black"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          Passer au Pro <ArrowRight className="h-3 w-3" />
        </Button>
      </a>
    </div>
  );
}
