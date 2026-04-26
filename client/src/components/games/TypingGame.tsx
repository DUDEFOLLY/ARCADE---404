import { useState, useEffect } from "react";
import { NeonButton } from "../NeonButton";

interface TypingGameProps {
  onGameOver: (score: number) => void;
}

const WORDS = ["CYBER", "NEON", "MATRIX", "PROTOCOL", "GRID", "SYSTEM", "DREAMS", "VOID", "SIGNAL", "CODE", "ARCADE", "GHOST", "PULSE", "CORE", "BIT"];

export default function TypingGame({ onGameOver }: TypingGameProps) {
  const [word, setWord] = useState("");
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<"idle" | "playing">("idle");

  const nextWord = () => {
    setWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setInput("");
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameState("playing");
    nextWord();
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

  const handleInput = (val: string) => {
    setInput(val.toUpperCase());
    if (val.toUpperCase() === word) {
      setScore(s => s + 100);
      nextWord();
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 p-12">
      <div className="flex justify-between w-full max-w-md text-xl font-retro text-primary">
        <span>SCORE: {score}</span>
        <span>TIME: {timeLeft}s</span>
      </div>
      
      {gameState === "playing" ? (
        <div className="flex flex-col items-center gap-12">
          <div className="text-7xl font-orbitron text-white tracking-[0.2em] relative">
            <span className="opacity-20">{word}</span>
            <span className="absolute left-0 top-0 text-primary">{input}</span>
          </div>
          <input
            autoFocus
            type="text"
            value={input}
            onChange={(e) => handleInput(e.target.value)}
            className="bg-black/50 border-2 border-primary/50 text-2xl p-4 text-center font-mono text-primary focus:outline-none focus:border-primary w-80 uppercase tracking-widest"
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
          <NeonButton onClick={startGame} className="text-xl px-12 py-6">START TYPING</NeonButton>
        </div>
      )}
    </div>
  );
}
