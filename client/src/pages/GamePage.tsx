import { useState, lazy, Suspense } from "react";
import { useRoute, useLocation } from "wouter";
import { useGame } from "@/hooks/use-games";
import { GameLayout } from "@/components/GameLayout";
import { ScoreBoard } from "@/components/ScoreBoard";
import { GameOverDialog } from "@/components/GameOverDialog";
import { Loader2, AlertTriangle } from "lucide-react";
import { NeonButton } from "@/components/NeonButton";
import ComingSoon from "@/components/games/ComingSoon";

// Lazy load games
const SnakeGame = lazy(() => import("@/components/games/SnakeGame"));
const ClickerGame = lazy(() => import("@/components/games/ClickerGame"));
const MemoryGame = lazy(() => import("@/components/games/MemoryGame"));
const ReactionGame = lazy(() => import("@/components/games/ReactionGame"));
const GhostHammer = lazy(() => import("@/components/games/GhostHammer"));
const CyberDodge = lazy(() => import("@/components/games/CyberDodge"));
const PongGame = lazy(() => import("@/components/games/PongGame"));
const WhackGame = lazy(() => import("@/components/games/WhackGame"));
const SimonGame = lazy(() => import("@/components/games/SimonGame"));
const MathGame = lazy(() => import("@/components/games/MathGame"));
const TypingGame = lazy(() => import("@/components/games/TypingGame"));
const MinesweeperGame = lazy(() => import("@/components/games/MinesweeperGame"));
const RunnerGame = lazy(() => import("@/components/games/RunnerGame"));
const BreakoutGame = lazy(() => import("@/components/games/BreakoutGame"));
const TetrisGame = lazy(() => import("@/components/games/TetrisGame"));
const Game2048 = lazy(() => import("@/components/games/Game2048"));
const AsteroidsGame = lazy(() => import("@/components/games/AsteroidsGame"));

export default function GamePage() {
  const [match, params] = useRoute("/play/:slug");
  const slug = params?.slug || "";
  const { data: game, isLoading, error } = useGame(slug);
  const [_, setLocation] = useLocation();

  const [score, setScore] = useState<number | null>(null);
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [gameKey, setGameKey] = useState(0); // Force re-mount to reset game

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    setIsGameOverOpen(true);
  };

  const handleRestart = () => {
    setIsGameOverOpen(false);
    setScore(null);
    setGameKey(k => k + 1);
  };

  // Game Registry
  const renderGame = () => {
    const props = { onGameOver: handleGameOver };
    switch (slug) {
      case 'snake': return <SnakeGame {...props} />;
      case 'clicker': return <ClickerGame {...props} />;
      case 'memory': return <MemoryGame {...props} />;
      case 'reaction': return <ReactionGame {...props} />;
      case 'ghost-hammer': return <GhostHammer {...props} />;
      case 'cyber-dodge': return <CyberDodge {...props} />;
      case 'pong': return <PongGame {...props} />;
      case 'whack': return <WhackGame {...props} />;
      case 'simon': return <SimonGame {...props} />;
      case 'math': return <MathGame {...props} />;
      case 'typing': return <TypingGame {...props} />;
      case 'minesweeper': return <MinesweeperGame {...props} />;
      case 'runner': return <RunnerGame {...props} />;
      case 'breakout': return <BreakoutGame {...props} />;
      case 'tetris': return <TetrisGame {...props} />;
      case '2048': return <Game2048 {...props} />;
      case 'asteroids': return <AsteroidsGame {...props} />;
      default: return <ComingSoon />;
    }
  };

  if (isLoading) {
    return (
      <GameLayout>
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
        </div>
      </GameLayout>
    );
  }

  if (error || !game) {
    return (
      <GameLayout>
        <div className="flex flex-col h-[80vh] items-center justify-center space-y-6 text-center">
          <AlertTriangle className="w-24 h-24 text-destructive" />
          <h1 className="text-4xl font-orbitron text-destructive">GAME NOT FOUND</h1>
          <NeonButton onClick={() => setLocation("/")}>RETURN TO HUB</NeonButton>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
        {/* Game Area */}
        <div className="flex-1 bg-black/40 border border-white/10 rounded-lg overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/60">
            <h2 className="text-xl font-orbitron text-primary tracking-wider">
              {game.title}
            </h2>
            <div className="text-xs font-mono text-muted-foreground uppercase">
              {game.category} MODE
            </div>
          </div>
          
          <div className="flex-1 relative overflow-hidden bg-[url('/grid.svg')] bg-center">
            <Suspense fallback={
              <div className="flex h-full items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
            }>
              {/* Key ensures complete remount on restart */}
              <div className="w-full h-full" key={gameKey}>
                {renderGame()}
              </div>
            </Suspense>
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block h-full">
          <ScoreBoard gameId={game.id} />
        </div>
      </div>

      <GameOverDialog 
        isOpen={isGameOverOpen}
        score={score || 0}
        gameId={game.id}
        gameTitle={game.title}
        onClose={() => setIsGameOverOpen(false)}
        onRestart={handleRestart}
      />
    </GameLayout>
  );
}
