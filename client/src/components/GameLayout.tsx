import { Link } from "wouter";
import { Gamepad2, Trophy, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameLayoutProps {
  children: React.ReactNode;
}

export function GameLayout({ children }: GameLayoutProps) {
  return (
    <div className="h-screen flex flex-col relative overflow-hidden text-foreground">
      {/* CRT Overlay */}
      <div className="scanlines fixed inset-0 z-50 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2 border border-primary bg-primary/10 rounded-sm group-hover:bg-primary/20 transition-colors">
              <Gamepad2 className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <h1 
              data-text="ARCADE 404" 
              className="glitch text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary"
            >
              ARCADE 404
            </h1>
          </Link>

          <nav className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              SYSTEM ONLINE
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-primary scrollbar-track-transparent">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-12 bg-black/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground font-mono">
            EST. 2025 // NEON DREAMS CORP // NO SIGNAL
          </p>
        </div>
      </footer>
    </div>
  );
}
