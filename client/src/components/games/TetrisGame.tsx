import { useState, useEffect, useRef, useCallback } from "react";
import { NeonButton } from "../NeonButton";

interface TetrisProps {
  onGameOver: (score: number) => void;
}

const COLS = 10;
const ROWS = 20;
const CELL = 28;

const PIECES = [
  { shape: [[1,1,1,1]], color: "#00ffff" },         // I
  { shape: [[1,1],[1,1]], color: "#ffff00" },        // O
  { shape: [[0,1,0],[1,1,1]], color: "#ff00ff" },    // T
  { shape: [[1,0],[1,0],[1,1]], color: "#ff8800" },  // L
  { shape: [[0,1],[0,1],[1,1]], color: "#0088ff" },  // J
  { shape: [[0,1,1],[1,1,0]], color: "#00ff88" },    // S
  { shape: [[1,1,0],[0,1,1]], color: "#ff4444" },    // Z
];

type Board = (string | null)[][];

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function rotatePiece(shape: number[][]): number[][] {
  return shape[0].map((_, i) => shape.map(row => row[i]).reverse());
}

function isValid(board: Board, shape: number[][], ox: number, oy: number) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nr = oy + r, nc = ox + c;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc]) return false;
    }
  }
  return true;
}

function placePiece(board: Board, shape: number[][], ox: number, oy: number, color: string): Board {
  const b = board.map(r => [...r]);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) b[oy + r][ox + c] = color;
    }
  }
  return b;
}

function clearLines(board: Board): { board: Board; lines: number } {
  const newBoard = board.filter(row => row.some(c => c === null));
  const cleared = ROWS - newBoard.length;
  const empty = Array.from({ length: cleared }, () => Array(COLS).fill(null));
  return { board: [...empty, ...newBoard], lines: cleared };
}

export default function TetrisGame({ onGameOver }: TetrisProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    board: emptyBoard(),
    piece: PIECES[Math.floor(Math.random() * PIECES.length)],
    pieceX: 3,
    pieceY: 0,
    score: 0,
    lines: 0,
    level: 1,
    gameOver: false,
    paused: false,
  });
  const [phase, setPhase] = useState<"idle" | "playing" | "gameover">("idle");
  const [displayScore, setDisplayScore] = useState(0);
  const [displayLines, setDisplayLines] = useState(0);
  const dropRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const spawnPiece = useCallback(() => {
    const s = stateRef.current;
    const next = PIECES[Math.floor(Math.random() * PIECES.length)];
    s.piece = next;
    s.pieceX = Math.floor(COLS / 2) - Math.floor(next.shape[0].length / 2);
    s.pieceY = 0;
    if (!isValid(s.board, s.piece.shape, s.pieceX, s.pieceY)) {
      s.gameOver = true;
      setPhase("gameover");
      onGameOver(s.score);
    }
  }, [onGameOver]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;

    ctx.fillStyle = "#000010";
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(COLS * CELL, r * CELL); ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, ROWS * CELL); ctx.stroke();
    }

    // Board
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = s.board[r][c];
        if (color) {
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
        }
      }
    }

    // Ghost piece
    let ghostY = s.pieceY;
    while (isValid(s.board, s.piece.shape, s.pieceX, ghostY + 1)) ghostY++;
    if (ghostY !== s.pieceY) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      for (let r = 0; r < s.piece.shape.length; r++) {
        for (let c = 0; c < s.piece.shape[r].length; c++) {
          if (s.piece.shape[r][c]) {
            ctx.fillRect((s.pieceX + c) * CELL + 1, (ghostY + r) * CELL + 1, CELL - 2, CELL - 2);
          }
        }
      }
    }

    // Active piece
    ctx.fillStyle = s.piece.color;
    ctx.shadowColor = s.piece.color;
    ctx.shadowBlur = 12;
    for (let r = 0; r < s.piece.shape.length; r++) {
      for (let c = 0; c < s.piece.shape[r].length; c++) {
        if (s.piece.shape[r][c]) {
          ctx.fillRect((s.pieceX + c) * CELL + 1, (s.pieceY + r) * CELL + 1, CELL - 2, CELL - 2);
        }
      }
    }
    ctx.shadowBlur = 0;
  }, []);

  const moveDown = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver || s.paused) return;
    if (isValid(s.board, s.piece.shape, s.pieceX, s.pieceY + 1)) {
      s.pieceY++;
    } else {
      s.board = placePiece(s.board, s.piece.shape, s.pieceX, s.pieceY, s.piece.color);
      const { board, lines } = clearLines(s.board);
      s.board = board;
      s.lines += lines;
      const lineScore = [0, 100, 300, 500, 800][lines] || 0;
      s.score += lineScore * s.level;
      s.level = Math.floor(s.lines / 10) + 1;
      setDisplayScore(s.score);
      setDisplayLines(s.lines);
      spawnPiece();
    }
    draw();
  }, [draw, spawnPiece]);

  useEffect(() => {
    if (phase !== "playing") return;
    const interval = Math.max(100, 800 - (stateRef.current.level - 1) * 70);
    dropRef.current = setInterval(moveDown, interval);
    draw();
    return () => { if (dropRef.current) clearInterval(dropRef.current); };
  }, [phase, moveDown, draw, stateRef.current.level]);

  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (s.gameOver) return;
      if (e.key === "ArrowLeft") {
        if (isValid(s.board, s.piece.shape, s.pieceX - 1, s.pieceY)) s.pieceX--;
      } else if (e.key === "ArrowRight") {
        if (isValid(s.board, s.piece.shape, s.pieceX + 1, s.pieceY)) s.pieceX++;
      } else if (e.key === "ArrowDown") {
        moveDown();
      } else if (e.key === "ArrowUp" || e.key === "x") {
        const rotated = rotatePiece(s.piece.shape);
        if (isValid(s.board, rotated, s.pieceX, s.pieceY)) s.piece = { ...s.piece, shape: rotated };
      } else if (e.key === " ") {
        // Hard drop
        while (isValid(s.board, s.piece.shape, s.pieceX, s.pieceY + 1)) s.pieceY++;
        moveDown();
        e.preventDefault();
      } else if (e.key === "p" || e.key === "P") {
        s.paused = !s.paused;
      }
      draw();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, moveDown, draw]);

  const handleStart = () => {
    stateRef.current = {
      board: emptyBoard(),
      piece: PIECES[Math.floor(Math.random() * PIECES.length)],
      pieceX: 3,
      pieceY: 0,
      score: 0,
      lines: 0,
      level: 1,
      gameOver: false,
      paused: false,
    };
    setDisplayScore(0);
    setDisplayLines(0);
    setPhase("playing");
  };

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-6 w-full h-full p-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={COLS * CELL}
          height={ROWS * CELL}
          className="rounded-lg border border-cyan-500/40"
          style={{ maxHeight: "70vh", width: "auto" }}
        />
        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg gap-4">
            <h2 className="text-3xl font-orbitron text-cyan-400" style={{ textShadow: "0 0 20px #00ffff" }}>BLOCK STACK</h2>
            <p className="text-muted-foreground font-mono text-sm text-center px-4">← → Move &nbsp;|&nbsp; ↑ Rotate &nbsp;|&nbsp; ↓ Soft drop &nbsp;|&nbsp; Space Hard drop</p>
            <NeonButton onClick={handleStart} data-testid="start-tetris">START GAME</NeonButton>
          </div>
        )}
        {phase === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg gap-4">
            <h2 className="text-2xl font-orbitron text-fuchsia-400">STACK OVERFLOW</h2>
            <p className="text-xl font-mono text-white">Score: {displayScore}</p>
            <NeonButton onClick={handleStart}>PLAY AGAIN</NeonButton>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4 text-center lg:text-left min-w-[120px]">
        <div className="bg-black/60 border border-cyan-500/30 rounded-lg p-4">
          <div className="text-xs font-mono text-muted-foreground uppercase mb-1">Score</div>
          <div className="text-2xl font-orbitron text-cyan-400" style={{ textShadow: "0 0 10px #00ffff" }}>{displayScore}</div>
        </div>
        <div className="bg-black/60 border border-fuchsia-500/30 rounded-lg p-4">
          <div className="text-xs font-mono text-muted-foreground uppercase mb-1">Lines</div>
          <div className="text-2xl font-orbitron text-fuchsia-400">{displayLines}</div>
        </div>
        <div className="bg-black/60 border border-lime-500/30 rounded-lg p-4">
          <div className="text-xs font-mono text-muted-foreground uppercase mb-1">Level</div>
          <div className="text-2xl font-orbitron text-lime-400">{stateRef.current.level}</div>
        </div>
      </div>
    </div>
  );
}
