import { useState, useEffect, useRef } from "react";
import { NeonButton } from "../NeonButton";

interface SimonGameProps {
  onGameOver: (score: number) => void;
}

const COLORS = [
  { id: 0, color: "bg-red-500", glow: "shadow-[0_0_20px_rgba(239,68,68,0.8)]", active: "bg-red-400" },
  { id: 1, color: "bg-blue-500", glow: "shadow-[0_0_20px_rgba(59,130,246,0.8)]", active: "bg-blue-400" },
  { id: 2, color: "bg-green-500", glow: "shadow-[0_0_20px_rgba(34,197,94,0.8)]", active: "bg-green-400" },
  { id: 3, color: "bg-yellow-500", glow: "shadow-[0_0_20px_rgba(234,179,8,0.8)]", active: "bg-yellow-400" },
];

export default function SimonGame({ onGameOver }: SimonGameProps) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [activeColor, setActiveColor] = useState<number | null>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("idle");
  const [isWatching, setIsPlaying] = useState(false);

  const startGame = () => {
    const first = Math.floor(Math.random() * 4);
    setSequence([first]);
    setPlayerSequence([]);
    setGameState("playing");
    playSequence([first]);
  };

  const playSequence = async (seq: number[]) => {
    setIsPlaying(true);
    for (const id of seq) {
      await new Promise(r => setTimeout(r, 400));
      setActiveColor(id);
      await new Promise(r => setTimeout(r, 400));
      setActiveColor(null);
    }
    setIsPlaying(false);
  };

  const handleColorClick = (id: number) => {
    if (isWatching || gameState !== "playing") return;

    const newPlayerSeq = [...playerSequence, id];
    setPlayerSequence(newPlayerSeq);

    if (id !== sequence[newPlayerSeq.length - 1]) {
      setGameState("gameover");
      onGameOver(sequence.length * 100);
      return;
    }

    if (newPlayerSeq.length === sequence.length) {
      const nextSequence = [...sequence, Math.floor(Math.random() * 4)];
      setSequence(nextSequence);
      setPlayerSequence([]);
      setTimeout(() => playSequence(nextSequence), 1000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 p-8">
      <div className="text-2xl font-retro text-primary">SEQUENCE: {sequence.length}</div>
      <div className="grid grid-cols-2 gap-4">
        {COLORS.map((c) => (
          <div
            key={c.id}
            onClick={() => handleColorClick(c.id)}
            className={`w-32 h-32 rounded-lg cursor-pointer transition-all duration-150 ${
              activeColor === c.id ? `${c.active} ${c.glow} scale-105` : `${c.color} opacity-40`
            } hover:opacity-60 active:scale-95`}
          />
        ))}
      </div>
      {gameState === "idle" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
          <NeonButton onClick={startGame} className="text-xl px-12 py-6">START ECHO</NeonButton>
        </div>
      )}
    </div>
  );
}
