import { useEffect, useRef, useState, useCallback } from "react";
import { NeonButton } from "../NeonButton";

interface SnakeGameProps {
  onGameOver: (score: number) => void;
}

const GRID_SIZE = 20;
const SPEED = 100;

type Point = { x: number; y: number };

export default function SnakeGame({ onGameOver }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);

  // Game state refs to avoid closure staleness in loop
  const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }]);
  const foodRef = useRef<Point>({ x: 15, y: 15 });
  const directionRef = useRef<Point>({ x: 0, y: 0 });
  const nextDirectionRef = useRef<Point>({ x: 0, y: 0 }); // Buffer for quick turns
  const gameLoopRef = useRef<number>();

  const initGame = () => {
    snakeRef.current = [{ x: 10, y: 10 }];
    foodRef.current = { x: 15, y: 5 };
    directionRef.current = { x: 1, y: 0 };
    nextDirectionRef.current = { x: 1, y: 0 };
    setScore(0);
    setIsPlaying(true);
  };

  const spawnFood = () => {
    const x = Math.floor(Math.random() * (canvasRef.current!.width / GRID_SIZE));
    const y = Math.floor(Math.random() * (canvasRef.current!.height / GRID_SIZE));
    foodRef.current = { x, y };
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isPlaying) return;

    const key = e.key;
    const current = directionRef.current;

    // Prevent 180 degree turns
    if (key === "ArrowUp" && current.y === 0) nextDirectionRef.current = { x: 0, y: -1 };
    if (key === "ArrowDown" && current.y === 0) nextDirectionRef.current = { x: 0, y: 1 };
    if (key === "ArrowLeft" && current.x === 0) nextDirectionRef.current = { x: -1, y: 0 };
    if (key === "ArrowRight" && current.x === 0) nextDirectionRef.current = { x: 1, y: 0 };
  }, [isPlaying]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const update = () => {
    if (!canvasRef.current) return;
    
    directionRef.current = nextDirectionRef.current;
    const head = { ...snakeRef.current[0] };
    head.x += directionRef.current.x;
    head.y += directionRef.current.y;

    const cols = canvasRef.current.width / GRID_SIZE;
    const rows = canvasRef.current.height / GRID_SIZE;

    // Wall collision
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
      endGame();
      return;
    }

    // Self collision
    if (snakeRef.current.some(s => s.x === head.x && s.y === head.y)) {
      endGame();
      return;
    }

    snakeRef.current.unshift(head);

    // Food collision
    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      setScore(s => s + 10);
      spawnFood();
    } else {
      snakeRef.current.pop();
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = "rgba(0, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for(let i=0; i<=canvas.width; i+=GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for(let i=0; i<=canvas.height; i+=GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    // Food
    ctx.fillStyle = "#ff00ff";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ff00ff";
    ctx.fillRect(
      foodRef.current.x * GRID_SIZE + 2, 
      foodRef.current.y * GRID_SIZE + 2, 
      GRID_SIZE - 4, 
      GRID_SIZE - 4
    );

    // Snake
    snakeRef.current.forEach((segment, i) => {
      ctx.fillStyle = i === 0 ? "#fff" : "#00ffff";
      ctx.shadowBlur = i === 0 ? 15 : 5;
      ctx.shadowColor = "#00ffff";
      ctx.fillRect(
        segment.x * GRID_SIZE + 1, 
        segment.y * GRID_SIZE + 1, 
        GRID_SIZE - 2, 
        GRID_SIZE - 2
      );
    });
    ctx.shadowBlur = 0;
  };

  const endGame = () => {
    setIsPlaying(false);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    onGameOver(score); // Pass score from state closure? careful, check ref or state
    // Actually score state is updated, so passing it directly works if this function is recreated
    // But since this is inside a component... better to use a ref for score if needed inside update loop
    // But we are calling endGame inside update loop, so we need current score.
    // Let's pass the calculated score based on length
    const finalScore = (snakeRef.current.length - 1) * 10;
    onGameOver(finalScore);
  };

  useEffect(() => {
    if (isPlaying) {
      const loop = setInterval(() => {
        update();
        draw();
      }, SPEED);
      gameLoopRef.current = loop as unknown as number;
      return () => clearInterval(loop);
    } else {
      // Initial draw
      draw();
    }
  }, [isPlaying]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 relative">
      <div className="absolute top-4 right-4 text-2xl font-retro text-primary">
        SCORE: {score}
      </div>
      
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="border-2 border-primary/50 bg-black shadow-[0_0_30px_rgba(0,255,255,0.1)] rounded-sm max-w-full"
      />
      
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <NeonButton onClick={initGame} className="text-xl px-12 py-6">
            START GAME
          </NeonButton>
        </div>
      )}
      
      <div className="mt-4 text-xs text-muted-foreground font-mono">
        USE ARROW KEYS TO MOVE
      </div>
    </div>
  );
}
