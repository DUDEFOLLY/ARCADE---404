import { useState, useEffect, useRef, useCallback } from "react";
import { NeonButton } from "../NeonButton";

interface Game2048Props {
  onGameOver: (score: number) => void;
}

type Grid = (number | null)[][];

const TILE_COLORS: Record<number, { bg: string; text: string; glow: string }> = {
  2:    { bg: "#0d1b2a", text: "#cce8ff", glow: "none" },
  4:    { bg: "#0f2944", text: "#99d6ff", glow: "none" },
  8:    { bg: "#00538a", text: "#fff", glow: "0 0 10px #0077bb" },
  16:   { bg: "#006ba8", text: "#fff", glow: "0 0 12px #0099dd" },
  32:   { bg: "#8800cc", text: "#fff", glow: "0 0 12px #aa00ff" },
  64:   { bg: "#aa00ff", text: "#fff", glow: "0 0 14px #cc44ff" },
  128:  { bg: "#00bb88", text: "#fff", glow: "0 0 14px #00ffaa" },
  256:  { bg: "#00ddaa", text: "#fff", glow: "0 0 16px #00ffcc" },
  512:  { bg: "#ffaa00", text: "#fff", glow: "0 0 16px #ffcc00" },
  1024: { bg: "#ff6600", text: "#fff", glow: "0 0 18px #ff8800" },
  2048: { bg: "#ff00ff", text: "#fff", glow: "0 0 24px #ff00ff" },
};

function newGrid(): Grid {
  const g: Grid = Array.from({ length: 4 }, () => Array(4).fill(null));
  return addTile(addTile(g));
}

function addTile(g: Grid): Grid {
  const empties: [number, number][] = [];
  g.forEach((row, r) => row.forEach((v, c) => { if (!v) empties.push([r, c]); }));
  if (!empties.length) return g;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const ng = g.map(row => [...row]);
  ng[r][c] = Math.random() < 0.9 ? 2 : 4;
  return ng;
}

function slideRow(row: (number | null)[]): { row: (number | null)[]; score: number } {
  const vals = row.filter(Boolean) as number[];
  let score = 0;
  const merged: (number | null)[] = [];
  let i = 0;
  while (i < vals.length) {
    if (i + 1 < vals.length && vals[i] === vals[i + 1]) {
      merged.push(vals[i] * 2);
      score += vals[i] * 2;
      i += 2;
    } else {
      merged.push(vals[i]);
      i++;
    }
  }
  while (merged.length < 4) merged.push(null);
  return { row: merged, score };
}

function moveGrid(grid: Grid, dir: "left" | "right" | "up" | "down"): { grid: Grid; score: number; moved: boolean } {
  let g = grid.map(r => [...r]) as Grid;
  let totalScore = 0;
  let moved = false;

  const transpose = (m: Grid): Grid => m[0].map((_, i) => m.map(r => r[i]));
  const reverseRows = (m: Grid): Grid => m.map(r => [...r].reverse());

  if (dir === "right") g = reverseRows(g);
  if (dir === "up") g = transpose(g);
  if (dir === "down") g = transpose(reverseRows(g));

  const newG: Grid = g.map(row => {
    const { row: newRow, score } = slideRow(row);
    totalScore += score;
    if (JSON.stringify(newRow) !== JSON.stringify(row)) moved = true;
    return newRow;
  });

  let result: Grid = newG;
  if (dir === "right") result = reverseRows(newG);
  if (dir === "up") result = transpose(newG);
  if (dir === "down") result = reverseRows(transpose(newG));

  return { grid: result, score: totalScore, moved };
}

function isGameOver(grid: Grid): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!grid[r][c]) return false;
      if (c < 3 && grid[r][c] === grid[r][c + 1]) return false;
      if (r < 3 && grid[r][c] === grid[r + 1][c]) return false;
    }
  }
  return true;
}

export default function Game2048({ onGameOver }: Game2048Props) {
  const [grid, setGrid] = useState<Grid>(newGrid);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<"idle" | "playing" | "gameover">("idle");
  const [won, setWon] = useState(false);
  const touchStart = useRef<[number, number] | null>(null);
  const scoreRef = useRef(0);

  const handleMove = useCallback((dir: "left" | "right" | "up" | "down") => {
    if (phase !== "playing") return;
    setGrid(prev => {
      const { grid: newG, score: gained, moved } = moveGrid(prev, dir);
      if (!moved) return prev;
      const withTile = addTile(newG);
      if (!won && withTile.some(row => row.some(v => v === 2048))) {
        setWon(true);
      }
      const newScore = scoreRef.current + gained;
      scoreRef.current = newScore;
      setScore(newScore);
      if (isGameOver(withTile)) {
        setPhase("gameover");
        onGameOver(newScore);
      }
      return withTile;
    });
  }, [phase, won, onGameOver]);

  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, "left" | "right" | "up" | "down"> = {
        ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
        a: "left", d: "right", w: "up", s: "down",
      };
      if (map[e.key]) { e.preventDefault(); handleMove(map[e.key]); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, handleMove]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = [e.touches[0].clientX, e.touches[0].clientY];
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current[0];
    const dy = e.changedTouches[0].clientY - touchStart.current[1];
    touchStart.current = null;
    if (Math.abs(dx) > Math.abs(dy)) {
      handleMove(dx > 0 ? "right" : "left");
    } else {
      handleMove(dy > 0 ? "down" : "up");
    }
  };

  const handleStart = () => {
    const g = newGrid();
    scoreRef.current = 0;
    setGrid(g);
    setScore(0);
    setWon(false);
    setPhase("playing");
  };

  const tileStyle = (val: number | null) => {
    if (!val) return { background: "rgba(255,255,255,0.04)", color: "transparent", boxShadow: "none" };
    const c = TILE_COLORS[val] || { bg: "#ff00ff", text: "#fff", glow: "0 0 24px #ff00ff" };
    return { background: c.bg, color: c.text, boxShadow: c.glow };
  };

  const fontSize = (val: number | null) => {
    if (!val || val < 100) return "text-2xl";
    if (val < 1000) return "text-xl";
    return "text-base";
  };

  return (
    <div
      className="flex flex-col items-center justify-center gap-5 w-full h-full p-6 select-none relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex justify-between w-full max-w-sm">
        <h2 className="text-2xl font-orbitron text-cyan-400" style={{ textShadow: "0 0 15px #00ffff" }}>2048 CORE</h2>
        <div className="bg-black/60 border border-cyan-500/30 rounded-lg px-4 py-1 text-center">
          <div className="text-xs font-mono text-muted-foreground">SCORE</div>
          <div className="text-lg font-orbitron text-cyan-400">{score}</div>
        </div>
      </div>

      {won && phase === "playing" && (
        <div className="text-sm font-orbitron text-fuchsia-400 animate-pulse" style={{ textShadow: "0 0 10px #ff00ff" }}>
          2048 REACHED! Keep going!
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 bg-black/60 border border-cyan-500/30 rounded-xl p-3 w-full max-w-sm">
        {grid.flat().map((val, i) => (
          <div
            key={i}
            data-testid={`tile-${i}`}
            className={`aspect-square rounded-lg flex items-center justify-center font-orbitron font-bold transition-all duration-100 ${fontSize(val)}`}
            style={tileStyle(val)}
          >
            {val}
          </div>
        ))}
      </div>

      <p className="text-xs font-mono text-muted-foreground text-center">Arrow keys or swipe to move tiles</p>

      {phase === "idle" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-30 gap-4 rounded-lg">
          <h2 className="text-4xl font-orbitron text-cyan-400" style={{ textShadow: "0 0 20px #00ffff" }}>2048 CORE</h2>
          <p className="text-muted-foreground font-mono text-sm text-center px-6">Merge tiles to reach 2048.<br />Use arrow keys or swipe to play.</p>
          <NeonButton onClick={handleStart} data-testid="start-2048">INITIALIZE CORE</NeonButton>
        </div>
      )}

      {phase === "gameover" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-30 gap-4 rounded-lg">
          <h2 className="text-3xl font-orbitron text-fuchsia-400">CORE OVERFLOW</h2>
          <p className="text-xl font-mono text-white">Score: {score}</p>
          <NeonButton onClick={handleStart}>RESTART</NeonButton>
        </div>
      )}
    </div>
  );
}
