import { useState, useEffect, useRef } from "react";
import { NeonButton } from "../NeonButton";

interface BreakoutProps {
  onGameOver: (score: number) => void;
}

export default function BreakoutGame({ onGameOver }: BreakoutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  
  const state = useRef({
    paddleX: 250,
    ballX: 300,
    ballY: 350,
    ballDX: 3,
    ballDY: -3,
    bricks: [] as {x: number, y: number, w: number, h: number, active: boolean}[]
  });

  const PADDLE_W = 100;
  const BALL_R = 8;

  const initBricks = () => {
    const bricks = [];
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 8; j++) {
        bricks.push({ x: 10 + j * 74, y: 50 + i * 25, w: 64, h: 20, active: true });
      }
    }
    state.current.bricks = bricks;
  };

  const update = () => {
    const s = state.current;
    s.ballX += s.ballDX;
    s.ballY += s.ballDY;

    if (s.ballX < 0 || s.ballX > 600) s.ballDX = -s.ballDX;
    if (s.ballY < 0) s.ballDY = -s.ballDY;
    
    // Paddle collision
    if (s.ballY > 370 && s.ballX > s.paddleX && s.ballX < s.paddleX + PADDLE_W) {
      s.ballDY = -s.ballDY;
    } else if (s.ballY > 400) {
      setIsPlaying(false);
      onGameOver(score);
    }

    // Brick collision
    s.bricks.forEach(b => {
      if (b.active && s.ballX > b.x && s.ballX < b.x + b.w && s.ballY > b.y && s.ballY < b.y + b.h) {
        b.active = false;
        s.ballDY = -s.ballDY;
        setScore(prev => prev + 100);
      }
    });

    if (s.bricks.filter(b => b.active).length === 0) {
      setIsPlaying(false);
      onGameOver(score + 5000);
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = state.current;

    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, 600, 400);

    ctx.fillStyle = "#00ffff";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#00ffff";
    ctx.fillRect(s.paddleX, 380, PADDLE_W, 10);
    
    ctx.beginPath(); ctx.arc(s.ballX, s.ballY, BALL_R, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = "#ff00ff";
    ctx.shadowColor = "#ff00ff";
    s.bricks.forEach(b => {
      if (b.active) ctx.fillRect(b.x, b.y, b.w, b.h);
    });
    ctx.shadowBlur = 0;
  };

  useEffect(() => {
    if (!isPlaying) return;
    const loop = setInterval(() => { update(); draw(); }, 1000/60);
    return () => clearInterval(loop);
  }, [isPlaying, score]);

  const handleMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) state.current.paddleX = Math.max(0, Math.min(600 - PADDLE_W, e.clientX - rect.left - PADDLE_W/2));
  };

  return (
    <div className="flex flex-col items-center gap-4 relative">
      <div className="text-xl font-retro text-primary">FIREWALL: {score}</div>
      <canvas ref={canvasRef} width={600} height={400} onMouseMove={handleMove} className="border-2 border-primary/50 bg-black max-w-full cursor-none" />
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <NeonButton onClick={() => { initBricks(); setIsPlaying(true); setScore(0); state.current.ballY = 350; }} className="text-xl px-12 py-6">BREACH FIREWALL</NeonButton>
        </div>
      )}
    </div>
  );
}
