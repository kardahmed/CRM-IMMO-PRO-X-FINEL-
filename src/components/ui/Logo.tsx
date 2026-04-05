import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  showText?: boolean;
  collapsed?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className, 
  width = 40, 
  height = 40,
  showText = true 
}) => {
  return (
    <div className={cn("flex items-center gap-3 group", className)}>
      <div className="relative transition-all duration-500 group-hover:scale-110 group-hover:rotate-1">
        <Image 
          src="/logo.png" 
          alt="IMMO PRO-X" 
          width={width} 
          height={height}
          className="relative z-10 block rounded-xl shadow-sm"
        />
      </div>
      {showText && (
        <span className="text-xl font-black tracking-tighter text-foreground uppercase italic flex items-center gap-1.5">
          IMMO PRO-X
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </span>
      )}
    </div>
  );
};
