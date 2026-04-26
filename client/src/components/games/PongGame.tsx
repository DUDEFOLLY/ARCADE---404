import { useState, useEffect, useRef, useCallback } from "react";
import { NeonButton } from "../NeonButton";

interface PongGameProps {
  onGameOver: (score: number) => void;
}

export default function PongGame({ onGameOver }: PongGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  
  const gameState = useRef({
    paddle1Y: 150,
    paddle2Y: 150,
    ballX: 300,
    ballY: 200,
    ballDX: 4,
    ballDY: 4,
    p1Score: 0
  });

  const PADDLE_HEIGHT = 80;
  const PADDLE_WIDTH = 10;
  const BALL_SIZE = 8;
  const WINNING_SCORE = 5;

  const resetBall = () => {
    gameState.current.ballX = 300;
    gameState.current.ballY = 200;
    gameState.current.ballDX = -gameState.current.ballDX;
  };

  const update = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const state = gameState.current;

    // Ball movement
    state.ballX += state.ballDX;
    state.ballY += state.ballDY;

    // Wall bounce
    if (state.ballY < 0 || state.ballY > canvas.height) {
      state.ballDY = -state.ballDY;
    }

    // Paddle collision
    if (state.ballX < PADDLE_WIDTH) {
      if (state.ballY > state.paddle1Y && state.ballY < state.paddle1Y + PADDLE_HEIGHT) {
        state.ballDX = -state.ballDX;
        setScore(s => s + 100);
      } else {
        onGameOver(score);
        setIsPlaying(false);
      }
    }

    if (state.ballX > canvas.width - PADDLE_WIDTH) {
      if (state.ballY > state.paddle2Y && state.ballY < state.paddle2Y + PADDLE_HEIGHT) {
        state.ballDX = -state.ballDX;
      } else {
        state.p1Score++;
        resetBall();
      }
    }

    // Simple AI
    const paddle2Center = state.paddle2Y + PADDLE_HEIGHT / 2;
    if (paddle2Center < state.ballY - 35) state.paddle2Y += 4;
    else if (paddle2Center > state.ballY + 35) state.paddle2Y -= 4;
  }, [onGameOver, score]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const state = gameState.current;

    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#00ffff";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#00ffff";
    
    // Paddles
    ctx.fillRect(0, state.paddle1Y, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillRect(canvas.width - PADDLE_WIDTH, state.paddle2Y, PADDLE_WIDTH, PADDLE_HEIGHT);
    
    // Ball
    ctx.fillRect(state.ballX - BALL_SIZE/2, state.ballY - BALL_SIZE/2, BALL_SIZE, BALL_SIZE);
    
    ctx.shadowBlur = 0;
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      update();
      draw();
    }, 1000 / 60);
    return () => clearInterval(interval);
  }, [isPlaying, update, draw]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top - PADDLE_HEIGHT / 2;
    gameState.current.paddle1Y = Math.max(0, Math.min(canvasRef.current.height - PADDLE_HEIGHT, y));
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 relative">
      <div className="absolute top-4 right-4 text-2xl font-retro text-primary">SCORE: {score}</div>
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        onMouseMove={handleMouseMove}
        className="border-2 border-primary/50 bg-black cursor-none max-w-full"
      />
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <NeonButton onClick={() => setIsPlaying(true)} className="text-xl px-12 py-6">START PONG</NeonButton>
        </div>
      )}
    </div>
  );
}
