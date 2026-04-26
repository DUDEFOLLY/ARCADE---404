import { useState, useEffect, useRef } from "react";
import { NeonButton } from "../NeonButton";

interface RunnerProps {
  onGameOver: (score: number) => void;
}

export default function RunnerGame({ onGameOver }: RunnerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  
  const state = useRef({
    jump: false,
    playerY: 300,
    velocity: 0,
    obstacles: [{ x: 600, w: 20, h: 40 }],
    frame: 0
  });

  const GRAVITY = 0.8;
  const JUMP_FORCE = -15;
  const GROUND_Y = 300;

  const update = () => {
    const s = state.current;
    
    // Jump physics
    if (s.jump && s.playerY === GROUND_Y) {
      s.velocity = JUMP_FORCE;
      s.jump = false;
    }
    s.velocity += GRAVITY;
    s.playerY += s.velocity;
    if (s.playerY > GROUND_Y) {
      s.playerY = GROUND_Y;
      s.velocity = 0;
    }

    // Obstacles
    if (s.frame % 100 === 0) {
      s.obstacles.push({ x: 600, w: 20 + Math.random() * 20, h: 30 + Math.random() * 30 });
    }
    
    s.obstacles.forEach(obs => {
      obs.x -= 5 + (score / 1000);
      
      // Collision
      if (100 < obs.x + obs.w && 140 > obs.x && s.playerY + 40 > 340 - obs.h) {
        setIsPlaying(false);
        onGameOver(score);
      }
    });
    
    s.obstacles = s.obstacles.filter(o => o.x > -50);
    setScore(prev => prev + 1);
    s.frame++;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = state.current;

    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ground
    ctx.strokeStyle = "#00ffff";
    ctx.beginPath(); ctx.moveTo(0, 340); ctx.lineTo(600, 340); ctx.stroke();

    // Player
    ctx.fillStyle = "#ff00ff";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ff00ff";
    ctx.fillRect(100, s.playerY, 40, 40);

    // Obstacles
    ctx.fillStyle = "#00ffff";
    ctx.shadowColor = "#00ffff";
    s.obstacles.forEach(obs => {
      ctx.fillRect(obs.x, 340 - obs.h, obs.w, obs.h);
    });
    ctx.shadowBlur = 0;
  };

  useEffect(() => {
    if (!isPlaying) return;
    const loop = setInterval(() => { update(); draw(); }, 1000/60);
    const handleKey = (e: KeyboardEvent) => { if (e.code === "Space") state.current.jump = true; };
    window.addEventListener("keydown", handleKey);
    return () => { clearInterval(loop); window.removeEventListener("keydown", handleKey); };
  }, [isPlaying, score]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 relative">
      <div className="absolute top-4 right-4 text-2xl font-retro text-primary">SCORE: {score}</div>
      <canvas ref={canvasRef} width={600} height={400} className="border-2 border-primary/50 bg-black max-w-full" />
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <NeonButton onClick={() => { setIsPlaying(true); setScore(0); state.current.obstacles = []; }} className="text-xl px-12 py-6">INITIATE RUN</NeonButton>
        </div>
      )}
      <div className="mt-4 text-xs text-muted-foreground font-mono">PRESS SPACE TO JUMP</div>
    </div>
  );
}
