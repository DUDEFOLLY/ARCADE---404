import { useState, useEffect, useCallback } from "react";
import { NeonButton } from "../NeonButton";
import { Bomb } from "lucide-react";

interface MinesweeperProps {
  onGameOver: (score: number) => void;
}

type Cell = {
  isMine: boolean;
  isRevealed: boolean;
  neighborCount: number;
};

export default function MinesweeperGame({ onGameOver }: MinesweeperProps) {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [status, setGameState] = useState<"idle" | "playing" | "gameover" | "win">("idle");
  const size = 8;
  const minesCount = 10;

  const initGrid = useCallback(() => {
    const newGrid: Cell[][] = Array(size).fill(null).map(() => 
      Array(size).fill(null).map(() => ({ isMine: false, isRevealed: false, neighborCount: 0 }))
    );

    let placed = 0;
    while (placed < minesCount) {
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      if (!newGrid[r][c].isMine) {
        newGrid[r][c].isMine = true;
        placed++;
      }
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!newGrid[r][c].isMine) {
          let count = 0;
          for (let dr = -1; r + dr >= 0 && r + dr < size && dr <= 1; dr++) {
            for (let dc = -1; c + dc >= 0 && c + dc < size && dc <= 1; dc++) {
              if (newGrid[r + dr][c + dc].isMine) count++;
            }
          }
          newGrid[r][c].neighborCount = count;
        }
      }
    }
    setGrid(newGrid);
    setGameState("playing");
  }, []);

  const reveal = (r: number, c: number) => {
    if (status !== "playing" || grid[r][c].isRevealed) return;

    const newGrid = [...grid.map(row => [...row])];
    if (newGrid[r][c].isMine) {
      setGameState("gameover");
      onGameOver(0);
      return;
    }

    const floodFill = (row: number, col: number) => {
      if (row < 0 || row >= size || col < 0 || col >= size || newGrid[row][col].isRevealed || newGrid[row][col].isMine) return;
      newGrid[row][col].isRevealed = true;
      if (newGrid[row][col].neighborCount === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            floodFill(row + dr, col + dc);
          }
        }
      }
    };

    floodFill(r, c);
    setGrid(newGrid);

    const revealedCount = newGrid.flat().filter(cell => cell.isRevealed).length;
    if (revealedCount === size * size - minesCount) {
      setGameState("win");
      onGameOver(5000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <div className="text-xl font-retro text-primary">STATUS: {status.toUpperCase()}</div>
      <div className="grid grid-cols-8 gap-1 bg-white/5 p-2 rounded">
        {grid.map((row, r) => row.map((cell, c) => (
          <div
            key={`${r}-${c}`}
            onClick={() => reveal(r, c)}
            className={`w-10 h-10 flex items-center justify-center cursor-pointer border border-white/10 transition-colors ${
              cell.isRevealed ? "bg-black/40" : "bg-primary/20 hover:bg-primary/30"
            }`}
          >
            {cell.isRevealed && (cell.isMine ? <Bomb className="text-destructive w-6 h-6" /> : (cell.neighborCount || ""))}
          </div>
        )))}
      </div>
      {status !== "playing" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
          <NeonButton onClick={initGrid} className="text-xl px-12 py-6">START DECRYPT</NeonButton>
        </div>
      )}
    </div>
  );
}
