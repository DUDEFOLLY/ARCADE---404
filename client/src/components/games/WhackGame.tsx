import { useState, useEffect, useRef } from "react";
import { NeonButton } from "../NeonButton";

interface WhackGameProps {
  onGameOver: (score: number) => void;
}

export default function WhackGame({ onGameOver }: WhackGameProps) {
  const [score, setScore] = useState(0);
  const [activeHole, setActiveHole] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const scoreRef = useRef(0);
  const timeLeftRef = useRef(30);

  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setIsPlaying(false);
          onGameOver(scoreRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    const scheduleSpawn = () => {
      const hole = Math.floor(Math.random() * 9);
      setActiveHole(hole);
      const duration = Math.max(400, 1000 - (30 - timeLeftRef.current) * 20);
      const hideTimeout = setTimeout(() => setActiveHole(null), duration);
      return hideTimeout;
    };

    scheduleSpawn();
    const spawner = setInterval(scheduleSpawn, 1100);

    return () => {
      clearInterval(timer);
      clearInterval(spawner);
    };
  }, [isPlaying, onGameOver]);

  const whack = (i: number) => {
    if (!isPlaying) return;
    if (i === activeHole) {
      setScore(s => s + 100);
      setActiveHole(null);
    }
  };

  const startGame = () => {
    scoreRef.current = 0;
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-6 w-full h-full relative">
      <div className="flex justify-between w-full max-w-md font-orbitron text-lg">
        <span className="text-cyan-400">SCORE: {score}</span>
        <span className="text-fuchsia-400">TIME: {timeLeft}s</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <button
            key={i}
            data-testid={`bug-hole-${i}`}
            onClick={() => whack(i)}
            className="w-24 h-24 rounded-full border-2 flex items-center justify-center cursor-crosshair transition-all duration-100 relative"
            style={{
              background: activeHole === i ? "rgba(0,255,100,0.15)" : "rgba(0,255,255,0.05)",
              borderColor: activeHole === i ? "#00ff66" : "rgba(0,255,255,0.2)",
              boxShadow: activeHole === i ? "0 0 20px rgba(0,255,100,0.6), inset 0 0 20px rgba(0,255,100,0.2)" : "none",
            }}
          >
            {activeHole === i && (
              <div
                data-testid={`bug-${i}`}
                className="flex flex-col items-center justify-center gap-0.5 animate-bounce select-none"
              >
                <span className="text-2xl">🐛</span>
                <span
                  className="text-[10px] font-bold leading-none"
                  style={{ color: "#00ff66", textShadow: "0 0 8px #00ff66" }}
                >
                  SMASH!
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {!isPlaying && timeLeft > 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-30 gap-4 rounded-lg">
          <h2 className="text-3xl font-orbitron text-cyan-400" style={{ textShadow: "0 0 20px #00ffff" }}>BUG SMASHER</h2>
          <p className="text-muted-foreground font-mono text-sm">Click the bugs before they escape!</p>
          <NeonButton onClick={startGame} data-testid="start-whack">START SMASHING</NeonButton>
        </div>
      )}

      {!isPlaying && timeLeft === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-30 gap-4 rounded-lg">
          <h2 className="text-2xl font-orbitron text-fuchsia-400">TIME'S UP!</h2>
          <p className="text-xl font-mono text-white">Score: {score}</p>
          <NeonButton onClick={startGame}>PLAY AGAIN</NeonButton>
        </div>
      )}
    </div>
  );
}
