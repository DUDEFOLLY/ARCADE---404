import { useState, useRef } from "react";
import { NeonButton } from "../NeonButton";
import { Zap } from "lucide-react";

interface ReactionGameProps {
  onGameOver: (score: number) => void;
}

export default function ReactionGame({ onGameOver }: ReactionGameProps) {
  const [gameState, setGameState] = useState<'idle' | 'waiting' | 'ready' | 'too-early' | 'result'>('idle');
  const [result, setResult] = useState<number | null>(null);
  
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<number>();

  const startGame = () => {
    setGameState('waiting');
    setResult(null);
    
    const randomDelay = 2000 + Math.random() * 3000;
    timeoutRef.current = window.setTimeout(() => {
      setGameState('ready');
      startTimeRef.current = Date.now();
    }, randomDelay);
  };

  const handleClick = () => {
    if (gameState === 'waiting') {
      clearTimeout(timeoutRef.current);
      setGameState('too-early');
    } else if (gameState === 'ready') {
      const endTime = Date.now();
      const reactionTime = endTime - startTimeRef.current;
      setResult(reactionTime);
      setGameState('result');
      
      // Calculate score: lower is better, but arcade needs high score.
      // 1000ms = 0 pts. 200ms = 1000pts.
      const score = Math.max(0, Math.floor((1000 - reactionTime) * 2));
      setTimeout(() => onGameOver(score), 1500);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px]">
      
      {gameState === 'idle' && (
        <div className="text-center space-y-8">
          <Zap className="w-24 h-24 text-primary mx-auto" />
          <h2 className="text-2xl font-orbitron">REACTION TEST</h2>
          <p className="text-muted-foreground font-mono">Click when the screen turns GREEN.</p>
          <NeonButton onClick={startGame} className="text-xl px-12 py-6">
            START
          </NeonButton>
        </div>
      )}

      {gameState === 'waiting' && (
        <div 
          onMouseDown={handleClick}
          className="absolute inset-0 bg-red-900/50 flex items-center justify-center cursor-pointer select-none"
        >
          <h2 className="text-4xl font-black text-white/50 animate-pulse">WAIT FOR IT...</h2>
        </div>
      )}

      {gameState === 'ready' && (
        <div 
          onMouseDown={handleClick}
          className="absolute inset-0 bg-green-500 flex items-center justify-center cursor-pointer select-none"
        >
          <h2 className="text-6xl font-black text-white">CLICK NOW!</h2>
        </div>
      )}

      {gameState === 'too-early' && (
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-destructive">TOO EARLY!</h2>
          <NeonButton onClick={startGame}>TRY AGAIN</NeonButton>
        </div>
      )}

      {gameState === 'result' && (
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-accent">{result} ms</h2>
          <p className="text-muted-foreground">Nice reflexes!</p>
        </div>
      )}
    </div>
  );
}
