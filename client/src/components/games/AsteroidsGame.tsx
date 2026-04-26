import { useEffect, useRef, useState, useCallback } from "react";
import { NeonButton } from "../NeonButton";

interface AsteroidsProps {
  onGameOver: (score: number) => void;
}

const W = 700;
const H = 500;
const TWO_PI = Math.PI * 2;

type Vec2 = { x: number; y: number };

interface Ship {
  pos: Vec2;
  vel: Vec2;
  angle: number;
  thrusting: boolean;
  invincible: number;
  dead: boolean;
}

interface Bullet {
  pos: Vec2;
  vel: Vec2;
  life: number;
}

interface Asteroid {
  pos: Vec2;
  vel: Vec2;
  radius: number;
  angle: number;
  spin: number;
  verts: Vec2[];
  tier: number; // 3=big, 2=med, 1=small
}

function randomVerts(n: number): Vec2[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * TWO_PI;
    const r = 0.7 + Math.random() * 0.3;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  });
}

function newAsteroid(tier: number, pos?: Vec2, vel?: Vec2): Asteroid {
  const radius = tier === 3 ? 48 : tier === 2 ? 28 : 14;
  const speed = tier === 3 ? 0.5 + Math.random() : tier === 2 ? 1 + Math.random() * 1.5 : 2 + Math.random() * 2;
  const angle = Math.random() * TWO_PI;
  return {
    pos: pos || { x: Math.random() * W, y: Math.random() * H },
    vel: vel || { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
    radius,
    angle: Math.random() * TWO_PI,
    spin: (Math.random() - 0.5) * 0.04,
    verts: randomVerts(10 + Math.floor(Math.random() * 5)),
    tier,
  };
}

function wrap(v: Vec2) {
  if (v.x < 0) v.x += W;
  if (v.x > W) v.x -= W;
  if (v.y < 0) v.y += H;
  if (v.y > H) v.y -= H;
}

function dist(a: Vec2, b: Vec2) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function drawAsteroid(ctx: CanvasRenderingContext2D, a: Asteroid) {
  ctx.save();
  ctx.translate(a.pos.x, a.pos.y);
  ctx.rotate(a.angle);
  ctx.beginPath();
  const v = a.verts;
  ctx.moveTo(v[0].x * a.radius, v[0].y * a.radius);
  for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x * a.radius, v[i].y * a.radius);
  ctx.closePath();
  ctx.strokeStyle = a.tier === 3 ? "#ff8800" : a.tier === 2 ? "#ffaa44" : "#ffcc88";
  ctx.shadowColor = a.tier === 3 ? "#ff4400" : "#ff8800";
  ctx.shadowBlur = 12;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawShip(ctx: CanvasRenderingContext2D, ship: Ship, frame: number) {
  if (ship.invincible > 0 && Math.floor(frame / 4) % 2 === 0) return;
  ctx.save();
  ctx.translate(ship.pos.x, ship.pos.y);
  ctx.rotate(ship.angle);
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-12, -10);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-12, 10);
  ctx.closePath();
  ctx.strokeStyle = "#00ffff";
  ctx.shadowColor = "#00ffff";
  ctx.shadowBlur = 16;
  ctx.lineWidth = 2;
  ctx.stroke();
  if (ship.thrusting && Math.floor(frame / 3) % 2 === 0) {
    ctx.beginPath();
    ctx.moveTo(-8, -5);
    ctx.lineTo(-18 - Math.random() * 10, 0);
    ctx.lineTo(-8, 5);
    ctx.strokeStyle = "#ff6600";
    ctx.shadowColor = "#ff6600";
    ctx.stroke();
  }
  ctx.restore();
}

export default function AsteroidsGame({ onGameOver }: AsteroidsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    ship: null as Ship | null,
    bullets: [] as Bullet[],
    asteroids: [] as Asteroid[],
    score: 0,
    lives: 3,
    wave: 1,
    gameState: "idle" as "idle" | "playing" | "dead" | "gameover",
    frame: 0,
    shootCooldown: 0,
    animId: 0,
    particles: [] as { pos: Vec2; vel: Vec2; life: number; color: string }[],
    keys: { left: false, right: false, up: false, space: false },
  });
  const [display, setDisplay] = useState({ score: 0, lives: 3, wave: 1 });
  const [phase, setPhase] = useState<"idle" | "playing" | "gameover">("idle");

  const spawnShip = useCallback(() => {
    stateRef.current.ship = {
      pos: { x: W / 2, y: H / 2 },
      vel: { x: 0, y: 0 },
      angle: -Math.PI / 2,
      thrusting: false,
      invincible: 180,
      dead: false,
    };
  }, []);

  const spawnWave = useCallback((wave: number) => {
    const s = stateRef.current;
    s.asteroids = [];
    const count = 3 + wave;
    for (let i = 0; i < count; i++) {
      let pos: Vec2;
      do { pos = { x: Math.random() * W, y: Math.random() * H }; }
      while (dist(pos, { x: W / 2, y: H / 2 }) < 120);
      s.asteroids.push(newAsteroid(3, pos));
    }
  }, []);

  const explode = useCallback((pos: Vec2, color = "#ff8800") => {
    const s = stateRef.current;
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * TWO_PI;
      const spd = 1 + Math.random() * 3;
      s.particles.push({
        pos: { ...pos },
        vel: { x: Math.cos(a) * spd, y: Math.sin(a) * spd },
        life: 30 + Math.random() * 30,
        color,
      });
    }
  }, []);

  const loop = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    s.frame++;
    if (s.shootCooldown > 0) s.shootCooldown--;

    // Ship update
    const ship = s.ship;
    if (ship && !ship.dead) {
      ship.thrusting = s.keys.up;
      if (s.keys.left) ship.angle -= 0.06;
      if (s.keys.right) ship.angle += 0.06;
      if (ship.thrusting) {
        ship.vel.x += Math.cos(ship.angle) * 0.25;
        ship.vel.y += Math.sin(ship.angle) * 0.25;
      }
      ship.vel.x *= 0.98;
      ship.vel.y *= 0.98;
      ship.pos.x += ship.vel.x;
      ship.pos.y += ship.vel.y;
      wrap(ship.pos);
      if (ship.invincible > 0) ship.invincible--;

      // Shoot
      if (s.keys.space && s.shootCooldown === 0) {
        s.bullets.push({
          pos: { x: ship.pos.x + Math.cos(ship.angle) * 20, y: ship.pos.y + Math.sin(ship.angle) * 20 },
          vel: { x: Math.cos(ship.angle) * 10 + ship.vel.x, y: Math.sin(ship.angle) * 10 + ship.vel.y },
          life: 60,
        });
        s.shootCooldown = 10;
      }
    }

    // Bullets
    s.bullets.forEach(b => { b.pos.x += b.vel.x; b.pos.y += b.vel.y; b.life--; wrap(b.pos); });
    s.bullets = s.bullets.filter(b => b.life > 0);

    // Asteroids
    s.asteroids.forEach(a => { a.pos.x += a.vel.x; a.pos.y += a.vel.y; a.angle += a.spin; wrap(a.pos); });

    // Bullet-Asteroid collisions
    const splitAsteroids: Asteroid[] = [];
    const deadBullets = new Set<number>();
    const deadAsteroids = new Set<number>();

    s.bullets.forEach((b, bi) => {
      s.asteroids.forEach((a, ai) => {
        if (deadAsteroids.has(ai)) return;
        if (dist(b.pos, a.pos) < a.radius) {
          deadBullets.add(bi);
          deadAsteroids.add(ai);
          explode(a.pos, a.tier === 1 ? "#ffcc00" : "#ff8800");
          const pts = a.tier === 3 ? 20 : a.tier === 2 ? 50 : 100;
          s.score += pts;
          if (a.tier > 1) {
            for (let i = 0; i < 2; i++) {
              const angle = Math.random() * TWO_PI;
              const spd = 1.5 + Math.random() * 2;
              splitAsteroids.push(newAsteroid(a.tier - 1, { ...a.pos }, { x: Math.cos(angle) * spd, y: Math.sin(angle) * spd }));
            }
          }
        }
      });
    });

    s.bullets = s.bullets.filter((_, i) => !deadBullets.has(i));
    s.asteroids = s.asteroids.filter((_, i) => !deadAsteroids.has(i)).concat(splitAsteroids);

    // Ship-Asteroid collision
    if (ship && !ship.dead && ship.invincible === 0) {
      for (const a of s.asteroids) {
        if (dist(ship.pos, a.pos) < a.radius * 0.85 + 12) {
          explode(ship.pos, "#00ffff");
          s.lives--;
          if (s.lives <= 0) {
            s.gameState = "gameover";
            setPhase("gameover");
            onGameOver(s.score);
            setDisplay({ score: s.score, lives: 0, wave: s.wave });
            return;
          }
          ship.dead = true;
          setTimeout(() => { spawnShip(); ship.dead = false; }, 1500);
          break;
        }
      }
    }

    // Next wave
    if (s.asteroids.length === 0) {
      s.wave++;
      spawnWave(s.wave);
      setDisplay(d => ({ ...d, wave: s.wave }));
    }

    // Particles
    s.particles.forEach(p => { p.pos.x += p.vel.x; p.pos.y += p.vel.y; p.vel.x *= 0.95; p.vel.y *= 0.95; p.life--; });
    s.particles = s.particles.filter(p => p.life > 0);

    if (s.frame % 6 === 0) setDisplay({ score: s.score, lives: s.lives, wave: s.wave });

    // DRAW
    ctx.fillStyle = "#00000f";
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 137.5) % W);
      const sy = ((i * 97.3) % H);
      ctx.fillRect(sx, sy, 1, 1);
    }

    // Particles
    s.particles.forEach(p => {
      ctx.globalAlpha = p.life / 60;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, 2, 0, TWO_PI);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Asteroids
    s.asteroids.forEach(a => drawAsteroid(ctx, a));

    // Bullets
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#00ff88";
    ctx.fillStyle = "#00ff88";
    s.bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.pos.x, b.pos.y, 3, 0, TWO_PI);
      ctx.fill();
    });

    // Ship
    if (ship && !ship.dead) drawShip(ctx, ship, s.frame);

    // Lives icons
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#00ffff";
    for (let i = 0; i < s.lives; i++) {
      ctx.save();
      ctx.translate(20 + i * 24, H - 20);
      ctx.rotate(-Math.PI / 2);
      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(10, 0); ctx.lineTo(-6, -6); ctx.lineTo(-4, 0); ctx.lineTo(-6, 6); ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
    ctx.shadowBlur = 0;

    s.animId = requestAnimationFrame(loop);
  }, [explode, onGameOver, spawnShip, spawnWave]);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.score = 0;
    s.lives = 3;
    s.wave = 1;
    s.bullets = [];
    s.particles = [];
    s.gameState = "playing";
    setDisplay({ score: 0, lives: 3, wave: 1 });
    setPhase("playing");
    spawnShip();
    spawnWave(1);
  }, [spawnShip, spawnWave]);

  useEffect(() => {
    if (phase !== "playing") return;
    stateRef.current.animId = requestAnimationFrame(loop);
    return () => { if (stateRef.current.animId) cancelAnimationFrame(stateRef.current.animId); };
  }, [phase, loop]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (e.key === "ArrowLeft" || e.key === "a") k.left = true;
      if (e.key === "ArrowRight" || e.key === "d") k.right = true;
      if (e.key === "ArrowUp" || e.key === "w") k.up = true;
      if (e.key === " ") { k.space = true; e.preventDefault(); }
      if (e.key === " " && phase === "idle") startGame();
    };
    const onUp = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (e.key === "ArrowLeft" || e.key === "a") k.left = false;
      if (e.key === "ArrowRight" || e.key === "d") k.right = false;
      if (e.key === "ArrowUp" || e.key === "w") k.up = false;
      if (e.key === " ") k.space = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, [phase, startGame]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full h-full p-4 relative">
      <div className="flex justify-between w-full max-w-2xl px-2 font-orbitron text-sm">
        <span className="text-cyan-400">SCORE: {display.score}</span>
        <span className="text-lime-400">WAVE: {display.wave}</span>
        <span className="text-fuchsia-400">LIVES: {"▲".repeat(Math.max(0, display.lives))}</span>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="rounded-lg border border-cyan-500/30"
          style={{ maxWidth: "100%", maxHeight: "65vh", width: "auto" }}
        />
        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm rounded-lg gap-5">
            <h2 className="text-4xl font-orbitron text-orange-400" style={{ textShadow: "0 0 30px #ff4400" }}>SPACE DEBRIS</h2>
            <div className="font-mono text-sm text-muted-foreground text-center space-y-1">
              <p>← → &nbsp; Rotate &nbsp;|&nbsp; ↑ Thrust &nbsp;|&nbsp; Space Shoot</p>
              <p className="text-xs opacity-70">Destroy all asteroids. They split when hit!</p>
            </div>
            <NeonButton onClick={startGame} data-testid="start-asteroids">LAUNCH MISSION</NeonButton>
          </div>
        )}
        {phase === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm rounded-lg gap-4">
            <h2 className="text-3xl font-orbitron text-orange-400">SHIP DESTROYED</h2>
            <p className="text-xl font-mono text-white">Score: {display.score}</p>
            <p className="text-sm font-mono text-muted-foreground">Wave {display.wave} reached</p>
            <NeonButton onClick={startGame}>RETRY MISSION</NeonButton>
          </div>
        )}
      </div>
      <p className="text-xs font-mono text-muted-foreground text-center">← → Rotate &nbsp;|&nbsp; ↑ Thrust &nbsp;|&nbsp; SPACE Shoot</p>
    </div>
  );
}
