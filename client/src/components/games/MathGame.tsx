import { useState, useEffect } from "react";
import { NeonButton } from "../NeonButton";

interface MathGameProps {
  onGameOver: (score: number) => void;
}

export default function MathGame({ onGameOver }: MathGameProps) {
  const [problem, setProblem] = useState({ q: "", a: 0 });
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<"idle" | "playing">("idle");

  const generateProblem = () => {
    const ops = ["+", "-", "*"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b;
    if (op === "*") {
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
    } else {
      a = Math.floor(Math.random() * 50) + 1;
      b = Math.floor(Math.random() * 50) + 1;
    }
    const q = `${a} ${op} ${b}`;
    const ans = eval(q);
    setProblem({ q, a: ans });
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameState("playing");
    generateProblem();
  };

  useEffect(() => {
    if (gameState !== "playing") return;
    if (timeLeft <= 0) {
      setGameState("idle");
      onGameOver(score);
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [gameState, timeLeft, score, onGameOver]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(answer) === problem.a) {
      setScore(s => s + 150);
      setAnswer("");
      generateProblem();
    } else {
      setScore(s => Math.max(0, s - 50));
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 p-12">
      <div className="flex justify-between w-full max-w-md text-xl font-retro text-primary">
        <span>SCORE: {score}</span>
        <span>TIME: {timeLeft}s</span>
      </div>
      
      {gameState === "playing" ? (
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6">
          <div className="text-6xl font-orbitron text-white tracking-widest">{problem.q} = ?</div>
          <input
            autoFocus
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="bg-black/50 border-2 border-primary/50 text-4xl p-4 text-center font-retro text-primary focus:outline-none focus:border-primary w-48"
          />
        </form>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
          <NeonButton onClick={startGame} className="text-xl px-12 py-6">START MATH</NeonButton>
        </div>
      )}
    </div>
  );
}
