"use client";

import { cn } from "@/lib/utils";

interface FlowConnectorProps {
  className?: string;
  active?: boolean;
}

export function VerticalFlowConnector({ className, active = true }: FlowConnectorProps) {
  return (
    <div className={cn("flex flex-col items-center w-full relative", className)}>
      {/* Background Line */}
      <div className="w-[3px] h-10 bg-neutral-100 dark:bg-neutral-800 rounded-full relative overflow-hidden">
        {/* Animated Flow Line */}
        {active && (
          <div className="absolute top-0 left-0 w-full h-[60%] bg-emerald-500/40 animate-pulse-flow rounded-full" />
        )}
      </div>
    </div>
  );
}

export function SmallFlowConnector({ className, active = true }: FlowConnectorProps) {
  return (
    <div className={cn("flex flex-col items-center h-8", className)}>
      <div className="w-[2px] h-full bg-neutral-100 rounded-full relative overflow-hidden">
        {active && (
          <div className="absolute top-0 left-0 w-full h-full bg-emerald-500/40 animate-pulse-flow" />
        )}
      </div>
    </div>
  );
}
