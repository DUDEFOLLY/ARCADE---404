import { useState } from "react";
import { useGames } from "@/hooks/use-games";
import { GameLayout } from "@/components/GameLayout";
import { NeonButton } from "@/components/NeonButton";
import { Link } from "wouter";
import { Loader2, Search, Gamepad, Ghost, MonitorPlay, Zap, MousePointer2, Grid, Brain, Calculator } from "lucide-react";
import { motion } from "framer-motion";

const ICONS: Record<string, any> = {
  snake: Ghost,
  pong: MonitorPlay,
  reaction: Zap,
  clicker: MousePointer2,
  memory: Grid,
  simon: Brain,
  math: Calculator,
  default: Gamepad
};

export default function Home() {
  const { data: games, isLoading } = useGames();
  const [search, setSearch] = useState("");

  const filteredGames = games?.filter(game => 
    game.title.toLowerCase().includes(search.toLowerCase()) ||
    game.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <GameLayout>
      {/* Hero Section */}
      <section className="mb-16 text-center space-y-6 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl md:text-7xl font-black font-orbitron mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 tracking-tighter filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            WELCOME TO THE <br />
            <span className="text-primary text-glow">GRID</span>
          </h1>
          <p className="text-xl text-muted-foreground font-mono max-w-2xl mx-auto">
            Select a protocol to initiate. Prove your worth on the leaderboards.
          </p>
        </motion.div>
      </section>

      {/* Search Bar */}
      <div className="max-w-md mx-auto mb-12 relative group">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
        <input 
          type="text"
          placeholder="SEARCH PROTOCOLS..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-black/50 border-2 border-white/10 rounded-none py-4 pl-12 pr-4 text-lg font-mono text-white focus:border-primary focus:outline-none focus:shadow-[0_0_20px_theme('colors.primary.DEFAULT')] transition-all"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGames?.map((game, index) => {
            const Icon = ICONS[game.slug] || ICONS.default;
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/play/${game.slug}`}>
                  <div className="group relative h-64 bg-card border border-white/10 hover:border-primary transition-all duration-300 overflow-hidden cursor-pointer hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(0,255,255,0.2)]">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] opacity-10" />
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 transition-transform duration-300 group-hover:scale-105">
                      <div className="mb-6 p-4 rounded-full bg-white/5 border border-white/10 group-hover:border-primary group-hover:bg-primary/20 transition-all duration-300">
                        <Icon className="w-12 h-12 text-white group-hover:text-primary transition-colors" />
                      </div>
                      <h3 className="text-2xl font-orbitron font-bold text-white mb-2 group-hover:text-primary transition-colors">
                        {game.title}
                      </h3>
                      <span className="inline-block px-2 py-1 text-xs font-mono border border-white/20 text-muted-foreground rounded uppercase group-hover:border-primary/50 group-hover:text-primary">
                        {game.category}
                      </span>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </GameLayout>
  );
}
