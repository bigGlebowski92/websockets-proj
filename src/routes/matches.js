import express from 'express';
import { db } from '../db/db.js';
import { matches } from '../db/schema.js';
import { createMatchSchema } from '../validation/matches.js';
import { getMatchStatus } from '../utils/match-status.js';
import { formatValidationError } from '../utils/validation-error.js';

export const matchesRouter = express.Router();

matchesRouter.get('/', (req, res) => {
  res.json({ message: 'Hello from Matches!' });
});

matchesRouter.post('/', async (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json(formatValidationError(parsed.error));
  }

  const { startTime, endTime, homeScore, awayScore } = parsed.data;

  try {
    const [event] = await db
      .insert(matches)
      .values({
        ...parsed.data,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status: getMatchStatus(startTime, endTime),
      })
      .returning();

    res.status(201).json({ data: event });
  } catch (error) {
    console.error({ error });
    return res.status(500).json({ error: 'Failed to create match' });
  }
});

export default matchesRouter;
