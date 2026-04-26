import { useState, useEffect, useRef, useCallback } from "react";
import { NeonButton } from "../NeonButton";

interface GhostHammerProps {
  onGameOver: (score: number) => void;
}

// SVG hammer cursor (32x32, hotspot at tip = top-left-ish)
const HAMMER_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect x='18' y='18' width='18' height='12' rx='2' fill='%23a0522d' stroke='%23ffaa00' stroke-width='1.5'/%3E%3Crect x='22' y='18' width='10' height='4' rx='1' fill='%23c0c0c0' stroke='%23ffffff' stroke-width='1'/%3E%3Crect x='14' y='28' width='4' height='14' rx='1' fill='%23a0522d' stroke='%23ffaa00' stroke-width='1'/%3E%3C/svg%3E") 20 20, crosshair`;

// Castle opening definitions: type, position (as % of 560x380 canvas)
const OPENINGS = [
  // Chimney tops - row 0
  { id: 0, type: "chimney", label: "Left Chimney",   cx: 95,  cy: 42,  w: 44, h: 52 },
  { id: 1, type: "chimney", label: "Mid Chimney",    cx: 280, cy: 28,  w: 44, h: 60 },
  { id: 2, type: "chimney", label: "Right Chimney",  cx: 465, cy: 42,  w: 44, h: 52 },
  // Upper windows - row 1
  { id: 3, type: "window",  label: "Left Window",    cx: 110, cy: 155, w: 54, h: 68 },
  { id: 4, type: "window",  label: "Center Window",  cx: 280, cy: 148, w: 54, h: 68 },
  { id: 5, type: "window",  label: "Right Window",   cx: 450, cy: 155, w: 54, h: 68 },
  // Ground doors - row 2
  { id: 6, type: "door",    label: "Left Door",      cx: 110, cy: 300, w: 54, h: 80 },
  { id: 7, type: "door",    label: "Main Gate",      cx: 280, cy: 295, w: 70, h: 90 },
  { id: 8, type: "door",    label: "Right Door",     cx: 450, cy: 300, w: 54, h: 80 },
];

const CW = 560;
const CH = 390;

export default function GhostHammer({ onGameOver }: GhostHammerProps) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [activeGhosts, setActiveGhosts] = useState<number[]>([]);
  const [phase, setPhase] = useState<"idle" | "playing" | "gameover">("idle");
  const [flashRed, setFlashRed] = useState<number | null>(null);
  const [smashed, setSmashed] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRef = useRef(phase);
  const timeRef = useRef(timeLeft);
  const scoreRef = useRef(score);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { timeRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const startGame = () => {
    scoreRef.current = 0;
    setScore(0);
    setTimeLeft(45);
    setActiveGhosts([]);
    setFlashRed(null);
    setSmashed(null);
    setPhase("playing");
  };

  const scheduleSpawn = useCallback(() => {
    if (phaseRef.current !== "playing") return;

    const idx = Math.floor(Math.random() * 9);
    setActiveGhosts(prev => {
      if (prev.includes(idx)) return prev;
      return [...prev, idx];
    });

    const elapsed = 45 - timeRef.current;
    const duration = Math.max(500, 1400 - elapsed * 20);

    setTimeout(() => {
      setActiveGhosts(prev => prev.filter(id => id !== idx));
    }, duration);

    const nextDelay = Math.max(300, 900 - elapsed * 10) + Math.random() * 400;
    spawnRef.current = setTimeout(scheduleSpawn, nextDelay);
  }, []);

  useEffect(() => {
    if (phase !== "playing") {
      if (timerRef.current) clearInterval(timerRef.current);
      if (spawnRef.current) clearTimeout(spawnRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setPhase("gameover");
          onGameOver(scoreRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    scheduleSpawn();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (spawnRef.current) clearTimeout(spawnRef.current);
    };
  }, [phase, scheduleSpawn, onGameOver]);

  const handleWhack = (id: number) => {
    if (phase !== "playing") return;
    if (activeGhosts.includes(id)) {
      setScore(s => s + 150);
      setSmashed(id);
      setActiveGhosts(prev => prev.filter(x => x !== id));
      setTimeout(() => setSmashed(null), 300);
    } else {
      setScore(s => Math.max(0, s - 50));
      setFlashRed(id);
      setTimeout(() => setFlashRed(null), 250);
    }
  };

  // Castle SVG background
  const castleSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0a0015"/>
          <stop offset="100%" stop-color="#1a0030"/>
        </linearGradient>
        <linearGradient id="stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2a2a3a"/>
          <stop offset="100%" stop-color="#1a1a2a"/>
        </linearGradient>
        <pattern id="stoneTex" width="28" height="18" patternUnits="userSpaceOnUse">
          <rect width="28" height="18" fill="none"/>
          <rect x="1" y="1" width="26" height="16" rx="1" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
        </pattern>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>

      <!-- Sky -->
      <rect width="${CW}" height="${CH}" fill="url(#sky)"/>

      <!-- Stars -->
      <circle cx="30" cy="20" r="1" fill="white" opacity="0.6"/>
      <circle cx="80" cy="45" r="1" fill="white" opacity="0.5"/>
      <circle cx="150" cy="15" r="1.5" fill="white" opacity="0.7"/>
      <circle cx="200" cy="55" r="1" fill="white" opacity="0.4"/>
      <circle cx="370" cy="20" r="1" fill="white" opacity="0.6"/>
      <circle cx="420" cy="50" r="1.5" fill="white" opacity="0.5"/>
      <circle cx="500" cy="30" r="1" fill="white" opacity="0.7"/>
      <circle cx="540" cy="60" r="1" fill="white" opacity="0.4"/>

      <!-- Moon -->
      <circle cx="490" cy="55" r="28" fill="#ffe8a0" opacity="0.9" filter="url(#glow)"/>
      <circle cx="500" cy="48" r="22" fill="#1a0030"/>

      <!-- Left turret -->
      <rect x="20" y="80" width="90" height="260" fill="url(#stone)" stroke="rgba(180,120,255,0.3)" stroke-width="1"/>
      <rect x="20" y="80" width="90" height="260" fill="url(#stoneTex)"/>
      <!-- Left turret battlements -->
      <rect x="20" y="60" width="18" height="25" rx="1" fill="url(#stone)" stroke="rgba(180,120,255,0.3)" stroke-width="1"/>
      <rect x="52" y="60" width="18" height="25" rx="1" fill="url(#stone)" stroke="rgba(180,120,255,0.3)" stroke-width="1"/>
      <rect x="84" y="60" width="18" height="25" rx="1" fill="url(#stone)" stroke="rgba(180,120,255,0.3)" stroke-width="1"/>

      <!-- Right turret -->
      <rect x="450" y="80" width="90" height="260" fill="url(#stone)" stroke="rgba(180,120,255,0.3)" stroke-width="1"/>
      <rect x="450" y="80" width="90" height="260" fill="url(#stoneTex)"/>
      <!-- Right turret battlements -->
      <rect x="450" y="60" width="18" height="25" rx="1" fill="url(#stone)"/>
      <rect x="482" y="60" width="18" height="25" rx="1" fill="url(#stone)"/>
      <rect x="514" y="60" width="18" height="25" rx="1" fill="url(#stone)"/>

      <!-- Main keep body -->
      <rect x="110" y="120" width="340" height="220" fill="url(#stone)" stroke="rgba(180,120,255,0.3)" stroke-width="1"/>
      <rect x="110" y="120" width="340" height="220" fill="url(#stoneTex)"/>
      <!-- Keep battlements -->
      <rect x="110" y="100" width="22" height="24" rx="1" fill="url(#stone)" stroke="rgba(180,120,255,0.3)"/>
      <rect x="148" y="100" width="22" height="24" rx="1" fill="url(#stone)" stroke="rgba(180,120,255,0.3)"/>
      <rect x="186" y="100" width="22" height="24" rx="1" fill="url(#stone)"/>
      <rect x="224" y="100" width="22" height="24" rx="1" fill="url(#stone)"/>
      <rect x="262" y="100" width="22" height="24" rx="1" fill="url(#stone)"/>
      <rect x="300" y="100" width="22" height="24" rx="1" fill="url(#stone)"/>
      <rect x="338" y="100" width="22" height="24" rx="1" fill="url(#stone)"/>
      <rect x="376" y="100" width="22" height="24" rx="1" fill="url(#stone)"/>
      <rect x="414" y="100" width="22" height="24" rx="1" fill="url(#stone)"/>

      <!-- LEFT CHIMNEY opening area (id 0) -->
      <rect x="73" y="0" width="44" height="55" rx="2" fill="#080012" stroke="rgba(180,120,255,0.4)" stroke-width="1.5"/>
      <rect x="68" y="52" width="54" height="10" rx="1" fill="#2a2a3a" stroke="rgba(180,120,255,0.3)" stroke-width="1"/>

      <!-- MID CHIMNEY opening area (id 1) -->
      <rect x="258" y="0" width="44" height="62" rx="2" fill="#080012" stroke="rgba(180,120,255,0.4)" stroke-width="1.5"/>
      <rect x="252" y="58" width="56" height="10" rx="1" fill="#2a2a3a" stroke="rgba(180,120,255,0.3)" stroke-width="1"/>

      <!-- RIGHT CHIMNEY opening area (id 2) -->
      <rect x="443" y="0" width="44" height="55" rx="2" fill="#080012" stroke="rgba(180,120,255,0.4)" stroke-width="1.5"/>
      <rect x="438" y="52" width="54" height="10" rx="1" fill="#2a2a3a" stroke="rgba(180,120,255,0.3)" stroke-width="1"/>

      <!-- LEFT WINDOW (id 3) -->
      <rect x="83" y="121" width="54" height="68" rx="0" fill="#080012" stroke="rgba(180,120,255,0.5)" stroke-width="2"/>
      <path d="M83,155 Q110,121 137,155" fill="none" stroke="rgba(180,120,255,0.5)" stroke-width="2"/>
      <!-- window bars -->
      <line x1="110" y1="125" x2="110" y2="189" stroke="rgba(180,120,255,0.25)" stroke-width="1"/>
      <line x1="83" y1="158" x2="137" y2="158" stroke="rgba(180,120,255,0.25)" stroke-width="1"/>

      <!-- CENTER WINDOW (id 4) -->
      <rect x="253" y="114" width="54" height="68" rx="0" fill="#080012" stroke="rgba(180,120,255,0.5)" stroke-width="2"/>
      <path d="M253,150 Q280,114 307,150" fill="none" stroke="rgba(180,120,255,0.5)" stroke-width="2"/>
      <line x1="280" y1="118" x2="280" y2="182" stroke="rgba(180,120,255,0.25)" stroke-width="1"/>
      <line x1="253" y1="152" x2="307" y2="152" stroke="rgba(180,120,255,0.25)" stroke-width="1"/>

      <!-- RIGHT WINDOW (id 5) -->
      <rect x="423" y="121" width="54" height="68" rx="0" fill="#080012" stroke="rgba(180,120,255,0.5)" stroke-width="2"/>
      <path d="M423,157 Q450,121 477,157" fill="none" stroke="rgba(180,120,255,0.5)" stroke-width="2"/>
      <line x1="450" y1="125" x2="450" y2="189" stroke="rgba(180,120,255,0.25)" stroke-width="1"/>
      <line x1="423" y1="160" x2="477" y2="160" stroke="rgba(180,120,255,0.25)" stroke-width="1"/>

      <!-- LEFT DOOR (id 6) -->
      <rect x="83" y="260" width="54" height="80" rx="0" fill="#080012" stroke="rgba(180,120,255,0.5)" stroke-width="2"/>
      <path d="M83,300 Q110,260 137,300" fill="#080012" stroke="rgba(180,120,255,0.5)" stroke-width="2"/>

      <!-- MAIN GATE (id 7) - portcullis style -->
      <rect x="245" y="250" width="70" height="90" rx="0" fill="#080012" stroke="rgba(180,120,255,0.6)" stroke-width="2.5"/>
      <path d="M245,295 Q280,250 315,295" fill="#080012" stroke="rgba(180,120,255,0.6)" stroke-width="2.5"/>
      <!-- portcullis bars -->
      <line x1="263" y1="260" x2="263" y2="340" stroke="rgba(180,120,255,0.2)" stroke-width="2"/>
      <line x1="280" y1="255" x2="280" y2="340" stroke="rgba(180,120,255,0.2)" stroke-width="2"/>
      <line x1="297" y1="260" x2="297" y2="340" stroke="rgba(180,120,255,0.2)" stroke-width="2"/>
      <line x1="245" y1="280" x2="315" y2="280" stroke="rgba(180,120,255,0.15)" stroke-width="1.5"/>
      <line x1="245" y1="306" x2="315" y2="306" stroke="rgba(180,120,255,0.15)" stroke-width="1.5"/>
      <line x1="245" y1="323" x2="315" y2="323" stroke="rgba(180,120,255,0.15)" stroke-width="1.5"/>

      <!-- RIGHT DOOR (id 8) -->
      <rect x="423" y="260" width="54" height="80" rx="0" fill="#080012" stroke="rgba(180,120,255,0.5)" stroke-width="2"/>
      <path d="M423,300 Q450,260 477,300" fill="#080012" stroke="rgba(180,120,255,0.5)" stroke-width="2"/>

      <!-- Ground -->
      <rect x="0" y="340" width="${CW}" height="50" fill="#0f0820"/>
      <rect x="0" y="338" width="${CW}" height="4" fill="rgba(180,120,255,0.2)"/>
    </svg>
  `;

  const castleDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(castleSVG)}`;

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full gap-3 p-4"
      style={{ cursor: phase === "playing" ? HAMMER_CURSOR : "default" }}
    >
      {/* HUD */}
      <div className="flex justify-between w-full max-w-2xl font-orbitron text-base px-2">
        <span className="text-cyan-400">SCORE: {score}</span>
        <span className="text-yellow-400 text-sm self-center">Smash the ghosts!</span>
        <span className="text-fuchsia-400">TIME: {timeLeft}s</span>
      </div>

      {/* Castle game area */}
      <div
        className="relative rounded-xl overflow-hidden border-2"
        style={{
          width: CW,
          maxWidth: "100%",
          height: CH,
          borderColor: "rgba(180,120,255,0.5)",
          boxShadow: "0 0 30px rgba(120,60,220,0.4)",
        }}
      >
        {/* Castle background */}
        <img
          src={castleDataUrl}
          alt="castle"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          draggable={false}
        />

        {/* Clickable opening overlays */}
        {OPENINGS.map(op => {
          const isActive = activeGhosts.includes(op.id);
          const isSmashed = smashed === op.id;
          const isFlash = flashRed === op.id;

          return (
            <div
              key={op.id}
              data-testid={`opening-${op.id}`}
              onClick={() => handleWhack(op.id)}
              className="absolute flex items-end justify-center overflow-hidden"
              style={{
                left: op.cx - op.w / 2,
                top: op.cy - op.h / 2,
                width: op.w,
                height: op.h,
                cursor: "inherit",
                zIndex: 10,
                background: isFlash ? "rgba(255,0,0,0.3)" : "transparent",
              }}
            >
              {/* Ghost */}
              {isActive && !isSmashed && (
                <div
                  data-testid={`ghost-${op.id}`}
                  className="flex flex-col items-center justify-center select-none animate-bounce"
                  style={{
                    animation: "ghostRise 0.3s ease-out",
                    filter: "drop-shadow(0 0 8px rgba(200,180,255,0.9))",
                  }}
                >
                  {/* Ghost SVG */}
                  <svg width={op.w * 0.72} height={op.h * 0.85} viewBox="0 0 40 48">
                    {/* Ghost body */}
                    <ellipse cx="20" cy="18" rx="14" ry="16" fill="#d4c8ff" opacity="0.95"/>
                    <rect x="6" y="18" width="28" height="20" fill="#d4c8ff" opacity="0.95"/>
                    {/* Wavy bottom */}
                    <path d="M6,38 Q10,44 14,38 Q18,44 22,38 Q26,44 30,38 Q33,44 34,38 L34,44 L6,44 Z"
                      fill="#d4c8ff" opacity="0.95"/>
                    {/* Eyes */}
                    <ellipse cx="15" cy="17" rx="3.5" ry="4" fill="#6a00ff"/>
                    <ellipse cx="25" cy="17" rx="3.5" ry="4" fill="#6a00ff"/>
                    <circle cx="15" cy="17" r="1.5" fill="white"/>
                    <circle cx="25" cy="17" r="1.5" fill="white"/>
                    {/* Glow */}
                    <ellipse cx="20" cy="18" rx="14" ry="16" fill="none"
                      stroke="#b090ff" stroke-width="1.5" opacity="0.6"/>
                  </svg>
                </div>
              )}

              {/* Smash effect */}
              {isSmashed && (
                <div className="text-2xl font-orbitron text-yellow-300 animate-ping pointer-events-none">
                  💥
                </div>
              )}
            </div>
          );
        })}

        {/* Idle overlay */}
        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm z-30 gap-4 rounded-xl">
            <div className="text-5xl">🏰</div>
            <h2 className="text-3xl font-orbitron text-fuchsia-400" style={{ textShadow: "0 0 20px #ff00ff" }}>
              GHOST HAMMER
            </h2>
            <p className="text-muted-foreground font-mono text-sm text-center px-4 max-w-xs">
              Ghosts are haunting the castle!<br/>
              Smash them as they emerge from doors, windows &amp; chimneys.<br/>
              <span className="text-yellow-400">Miss and lose points!</span>
            </p>
            <NeonButton onClick={startGame} data-testid="start-ghost-hammer">START HAUNTING</NeonButton>
          </div>
        )}

        {/* Game over overlay */}
        {phase === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-30 gap-4 rounded-xl">
            <div className="text-5xl">👻</div>
            <h2 className="text-2xl font-orbitron text-fuchsia-400">GHOSTS ESCAPED!</h2>
            <p className="text-xl font-mono text-white">Score: {score}</p>
            <NeonButton onClick={startGame}>HAUNTING AGAIN</NeonButton>
          </div>
        )}
      </div>

      <style>{`
        @keyframes ghostRise {
          from { transform: translateY(60%); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}
