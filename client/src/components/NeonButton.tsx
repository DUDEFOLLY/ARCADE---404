import React from 'react';
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'destructive';
  isLoading?: boolean;
}

export function NeonButton({ 
  children, 
  className, 
  variant = 'primary', 
  isLoading,
  disabled,
  ...props 
}: NeonButtonProps) {
  const variants = {
    primary: "border-primary text-primary hover:bg-primary/10 shadow-[0_0_10px_theme('colors.primary.DEFAULT')] hover:shadow-[0_0_20px_theme('colors.primary.DEFAULT')]",
    secondary: "border-secondary text-secondary hover:bg-secondary/10 shadow-[0_0_10px_theme('colors.secondary.DEFAULT')] hover:shadow-[0_0_20px_theme('colors.secondary.DEFAULT')]",
    accent: "border-accent text-accent hover:bg-accent/10 shadow-[0_0_10px_theme('colors.accent.DEFAULT')] hover:shadow-[0_0_20px_theme('colors.accent.DEFAULT')]",
    destructive: "border-destructive text-destructive hover:bg-destructive/10 shadow-[0_0_10px_theme('colors.destructive.DEFAULT')] hover:shadow-[0_0_20px_theme('colors.destructive.DEFAULT')]",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        "relative px-6 py-3 font-orbitron font-bold uppercase tracking-wider text-sm",
        "border-2 bg-transparent transition-all duration-300 ease-out",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
        variants[variant],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing...
        </span>
      ) : children}
      
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-current -mt-1 -ml-1 opacity-70" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current -mt-1 -mr-1 opacity-70" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current -mb-1 -ml-1 opacity-70" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-current -mb-1 -mr-1 opacity-70" />
    </button>
  );
}
