import { useState, useEffect, useRef, useCallback } from "react";
import { NeonButton } from "../NeonButton";

interface CyberDodgeProps {
  onGameOver: (score: number) => void;
}

const CANVAS_W = 320;
const CANVAS_H = 480;
const PLAYER_SIZE = 22;
const PLAYER_Y = CANVAS_H - 60;

export default function CyberDodge({ onGameOver }: CyberDodgeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    gameState: "idle" as "idle" | "playing" | "gameover",
    score: 0,
    playerX: CANVAS_W / 2 - PLAYER_SIZE / 2,
    obstacles: [] as { x: number; y: number; w: number; h: number; speed: number }[],
    frameCount: 0,
    animId: 0,
    keys: { left: false, right: false },
  });
  const [displayScore, setDisplayScore] = useState(0);
  const [phase, setPhase] = useState<"idle" | "playing" | "gameover">("idle");

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.gameState = "playing";
    s.score = 0;
    s.playerX = CANVAS_W / 2 - PLAYER_SIZE / 2;
    s.obstacles = [];
    s.frameCount = 0;
    setDisplayScore(0);
    setPhase("playing");
  }, []);

  const loop = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Move player
    const speed = 4;
    if (s.keys.left) s.playerX = Math.max(0, s.playerX - speed);
    if (s.keys.right) s.playerX = Math.min(CANVAS_W - PLAYER_SIZE, s.playerX + speed);

    // Spawn obstacles
    if (s.frameCount % 40 === 0) {
      const w = 20 + Math.random() * 40;
      s.obstacles.push({
        x: Math.random() * (CANVAS_W - w),
        y: -30,
        w,
        h: 14,
        speed: 2.5 + s.score / 2000,
      });
    }

    // Move obstacles + collision
    s.obstacles.forEach(obs => { obs.y += obs.speed; });

    const px = s.playerX, py = PLAYER_Y;
    const hit = s.obstacles.some(obs =>
      px < obs.x + obs.w &&
      px + PLAYER_SIZE > obs.x &&
      py < obs.y + obs.h &&
      py + PLAYER_SIZE > obs.y
    );

    s.obstacles = s.obstacles.filter(obs => obs.y < CANVAS_H + 30);
    s.frameCount++;
    s.score++;

    if (hit) {
      s.gameState = "gameover";
      setDisplayScore(s.score);
      setPhase("gameover");
      onGameOver(s.score);
      return;
    }

    if (s.frameCount % 10 === 0) setDisplayScore(s.score);

    // Draw
    ctx.fillStyle = "#000010";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid lines
    ctx.strokeStyle = "rgba(0,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let y = 0; y < CANVAS_H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
    }
    for (let x = 0; x < CANVAS_W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
    }

    // Player
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#00ffff";
    ctx.fillStyle = "#00ffff";
    ctx.beginPath();
    ctx.moveTo(px + PLAYER_SIZE / 2, py);
    ctx.lineTo(px + PLAYER_SIZE, py + PLAYER_SIZE);
    ctx.lineTo(px, py + PLAYER_SIZE);
    ctx.closePath();
    ctx.fill();

    // Obstacles
    ctx.shadowColor = "#ff00ff";
    ctx.fillStyle = "#ff00ff";
    s.obstacles.forEach(obs => {
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    });

    ctx.shadowBlur = 0;

    s.animId = requestAnimationFrame(loop);
  }, [onGameOver]);

  useEffect(() => {
    if (phase === "playing") {
      stateRef.current.animId = requestAnimationFrame(loop);
    }
    return () => {
      if (stateRef.current.animId) cancelAnimationFrame(stateRef.current.animId);
    };
  }, [phase, loop]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") stateRef.current.keys.left = true;
      if (e.key === "ArrowRight" || e.key === "d") stateRef.current.keys.right = true;
      if (e.key === " " && phase === "idle") startGame();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") stateRef.current.keys.left = false;
      if (e.key === "ArrowRight" || e.key === "d") stateRef.current.keys.right = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [phase, startGame]);

  // Touch/mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (stateRef.current.gameState !== "playing") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
    stateRef.current.playerX = Math.max(0, Math.min(CANVAS_W - PLAYER_SIZE, x - PLAYER_SIZE / 2));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (stateRef.current.gameState !== "playing") return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.touches[0].clientX - rect.left) / rect.width) * CANVAS_W;
    stateRef.current.playerX = Math.max(0, Math.min(CANVAS_W - PLAYER_SIZE, x - PLAYER_SIZE / 2));
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full h-full p-4 relative">
      <div className="flex justify-between w-full max-w-sm font-orbitron text-base">
        <span className="text-cyan-400">SCORE: {displayScore}</span>
        <span className="text-fuchsia-400 text-xs self-center">← → or mouse to move</span>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="rounded-lg border border-cyan-500/40"
          style={{ maxHeight: "60vh", width: "auto" }}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
        />
        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg gap-4">
            <h2 className="text-2xl font-orbitron text-cyan-400" style={{ textShadow: "0 0 20px #00ffff" }}>CYBER DODGE</h2>
            <p className="text-muted-foreground font-mono text-sm text-center px-4">Dodge incoming data streams.<br />Use ← → arrows or move your mouse.</p>
            <NeonButton onClick={startGame} data-testid="start-cyber-dodge">START MISSION</NeonButton>
          </div>
        )}
        {phase === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg gap-4">
            <h2 className="text-2xl font-orbitron text-fuchsia-400">SYSTEM FAILURE</h2>
            <p className="text-xl font-mono text-white">Score: {displayScore}</p>
            <NeonButton onClick={startGame}>RESTART</NeonButton>
          </div>
        )}
      </div>
    </div>
  );
}
