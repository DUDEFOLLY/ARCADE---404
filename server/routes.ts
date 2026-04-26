
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupWebSockets } from "./websockets";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // === GAMES ===
  app.get(api.games.list.path, async (req, res) => {
    const games = await storage.getGames();
    res.json(games);
  });

  app.get(api.games.get.path, async (req, res) => {
    const game = await storage.getGameBySlug(req.params.slug);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    res.json(game);
  });

  // === SCORES ===
  app.get(api.scores.list.path, async (req, res) => {
    const gameScores = await storage.getScores(Number(req.params.gameId));
    res.json(gameScores);
  });

  app.post(api.scores.submit.path, async (req, res) => {
    try {
      const input = api.scores.submit.input.parse(req.body);
      const score = await storage.createScore(input);
      res.status(201).json(score);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // === MESSAGES ===
  app.get(api.messages.list.path, async (req, res) => {
    const messages = await storage.getMessages();
    res.json(messages.reverse());
  });

  app.post(api.messages.send.path, async (req, res) => {
    try {
      const input = api.messages.send.input.parse(req.body);
      const message = await storage.createMessage(input);
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Initialize seed data
  await seedDatabase();
  
  // Setup WebSockets for live chat
  setupWebSockets(httpServer);

  return httpServer;
}

async function seedDatabase() {
  const existingGames = await storage.getGames();
  
  const gamesToSeed = [
    { slug: 'snake', title: 'Neon Snake', description: 'Classic snake game with a cyberpunk twist. Eat the glitches to grow.', category: 'Arcade', thumbnail: 'Gamepad2' },
    { slug: 'pong', title: 'Cyber Pong', description: 'The original arcade hit, reimagined for the future.', category: 'Arcade', thumbnail: 'Monitor' },
    { slug: 'memory', title: 'Memory Matrix', description: 'Test your cognitive retention in this pattern matching challenge.', category: 'Puzzle', thumbnail: 'Brain' },
    { slug: 'minesweeper', title: 'Data Miner', description: 'Avoid the corrupted data sectors. Clear the grid.', category: 'Puzzle', thumbnail: 'Bomb' },
    { slug: 'tetris', title: 'Block Stack', description: 'Arrange the falling data blocks to clear lines.', category: 'Arcade', thumbnail: 'LayoutGrid' },
    { slug: 'clicker', title: 'Bit Clicker', description: 'Generate bits by clicking. Upgrade your bandwidth.', category: 'Idle', thumbnail: 'MousePointer2' },
    { slug: 'simon', title: 'Echo Sequence', description: 'Repeat the sequence of signals. Don\'t lose the rhythm.', category: 'Memory', thumbnail: 'Activity' },
    { slug: 'whack', title: 'Bug Smasher', description: 'Eliminate the bugs before they crash the system.', category: 'Action', thumbnail: 'Hammer' },
    { slug: 'reaction', title: 'Reflex Test', description: 'Test your reaction time. Click when the color changes.', category: 'Action', thumbnail: 'Zap' },
    { slug: 'typing', title: 'Speed Type', description: 'Type the code snippets as fast as possible.', category: 'Educational', thumbnail: 'Keyboard' },
    { slug: 'math', title: 'Cyber Math', description: 'Solve the equations before the timer runs out.', category: 'Educational', thumbnail: 'Calculator' },
    { slug: '2048', title: '2048 Core', description: 'Merge the numbers to reach the 2048 core.', category: 'Puzzle', thumbnail: 'Grid3X3' },
    { slug: 'runner', title: 'Infinite Run', description: 'Jump over obstacles in this endless runner.', category: 'Action', thumbnail: 'Footprints' },
    { slug: 'breakout', title: 'Firewall Breaker', description: 'Smash through the firewall bricks.', category: 'Arcade', thumbnail: 'BrickWall' },
    { slug: 'asteroids', title: 'Space Debris', description: 'Destroy the asteroids before they hit your ship.', category: 'Arcade', thumbnail: 'Rocket' },
    { slug: 'ghost-hammer', title: 'Ghost Hammer', description: 'Banish the digital ghosts that haunt the machine.', category: 'Action', thumbnail: 'Ghost' },
    { slug: 'cyber-dodge', title: 'Cyber Dodge', description: 'Dodge the incoming data streams.', category: 'Action', thumbnail: 'ArrowRightLeft' }
  ];

  for (const game of gamesToSeed) {
    const existing = existingGames.find(g => g.slug === game.slug);
    if (!existing) {
      await storage.createGame(game);
    }
  }
  console.log('Seeded games database');
}
