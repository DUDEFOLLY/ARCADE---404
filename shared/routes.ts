
import { z } from 'zod';
import { insertScoreSchema, insertMessageSchema, games, scores, messages } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  games: {
    list: {
      method: 'GET' as const,
      path: '/api/games',
      responses: {
        200: z.array(z.custom<typeof games.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/games/:slug',
      responses: {
        200: z.custom<typeof games.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  scores: {
    list: {
      method: 'GET' as const,
      path: '/api/scores/:gameId',
      responses: {
        200: z.array(z.custom<typeof scores.$inferSelect>()),
      },
    },
    submit: {
      method: 'POST' as const,
      path: '/api/scores',
      input: insertScoreSchema,
      responses: {
        201: z.custom<typeof scores.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/messages',
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
      },
    },
    send: {
      method: 'POST' as const,
      path: '/api/messages',
      input: insertMessageSchema,
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
};

// ============================================
// HELPER
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPES
// ============================================
export type GameListResponse = z.infer<typeof api.games.list.responses[200]>;
export type GameDetailResponse = z.infer<typeof api.games.get.responses[200]>;
export type ScoreListResponse = z.infer<typeof api.scores.list.responses[200]>;
export type SubmitScoreInput = z.infer<typeof api.scores.submit.input>;
export type MessageListResponse = z.infer<typeof api.messages.list.responses[200]>;
export type SendMessageInput = z.infer<typeof api.messages.send.input>;
