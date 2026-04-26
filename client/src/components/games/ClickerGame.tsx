import { useState, useEffect, useRef } from "react";
import { NeonButton } from "../NeonButton";
import { MousePointer2, Timer } from "lucide-react";

interface ClickerGameProps {
  onGameOver: (score: number) => void;
}

export default function ClickerGame({ onGameOver }: ClickerGameProps) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isActive, setIsActive] = useState(false);
  const [clickEffect, setClickEffect] = useState<{id: number, x: number, y: number}[]>([]);
  
  const timerRef = useRef<number>();

  const startGame = () => {
    setScore(0);
    setTimeLeft(10);
    setIsActive(true);
    setClickEffect([]);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isActive) return;
    
    setScore(s => s + 1);
    
    // Add visual effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    
    setClickEffect(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setClickEffect(prev => prev.filter(p => p.id !== id));
    }, 500);
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      onGameOver(score);
    }
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, isActive]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px]">
      <div className="flex justify-between w-full max-w-md mb-8">
        <div className="flex items-center gap-2 text-2xl font-retro text-primary">
          <MousePointer2 /> {score}
        </div>
        <div className="flex items-center gap-2 text-2xl font-retro text-destructive">
          <Timer /> {timeLeft}s
        </div>
      </div>

      {!isActive ? (
        <NeonButton onClick={startGame} className="text-xl px-12 py-6">
          {timeLeft === 0 ? "TRY AGAIN" : "START BLITZ"}
        </NeonButton>
      ) : (
        <button
          onClick={handleClick}
          className="relative w-64 h-64 rounded-full border-4 border-accent bg-accent/10 
                     hover:bg-accent/20 active:scale-95 transition-all duration-75
                     shadow-[0_0_50px_theme('colors.accent.DEFAULT')]
                     flex items-center justify-center group"
        >
          <span className="text-4xl font-black text-accent uppercase tracking-wider group-hover:scale-110 transition-transform">
            CLICK!
          </span>
          
          {clickEffect.map(effect => (
            <span
              key={effect.id}
              className="absolute text-white font-bold text-xl pointer-events-none animate-ping"
              style={{ left: effect.x, top: effect.y }}
            >
              +1
            </span>
          ))}
        </button>
      )}
      
      <p className="mt-8 text-muted-foreground font-mono">
        CLICK AS FAST AS YOU CAN IN 10 SECONDS!
      </p>
    </div>
  );
}
