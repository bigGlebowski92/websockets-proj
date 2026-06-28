import express from 'express';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { commentary } from '../db/schema.js';
import { matchIdParamSchema } from '../validation/matches.js';
import {
  createCommentarySchema,
  listCommentaryQuerySchema,
} from '../validation/commentary.js';
import { formatValidationError } from '../utils/validation-error.js';

export const commentaryRouter = express.Router({ mergeParams: true });

const MAX_LIMIT = 100;

commentaryRouter.get('/', async (req, res) => {
  const paramsParsed = matchIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json(formatValidationError(paramsParsed.error));
  }

  const queryParsed = listCommentaryQuerySchema.safeParse(req.query);
  if (!queryParsed.success) {
    return res.status(400).json(formatValidationError(queryParsed.error));
  }

  const limit = Math.min(queryParsed.data.limit ?? 100, MAX_LIMIT);

  try {
    const data = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, paramsParsed.data.id))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    res.status(200).json({ data });
  } catch (error) {
    console.error({ error });
    return res.status(500).json({ error: 'Failed to list commentary' });
  }
});

commentaryRouter.post('/', async (req, res) => {
  const paramsParsed = matchIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json(formatValidationError(paramsParsed.error));
  }

  const bodyParsed = createCommentarySchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json(formatValidationError(bodyParsed.error));
  }

  const { period, ...commentaryData } = bodyParsed.data;
  const parsedPeriod =
    period !== undefined && !Number.isNaN(Number(period))
      ? parseInt(period, 10)
      : undefined;

  try {
    const [entry] = await db
      .insert(commentary)
      .values({
        matchId: paramsParsed.data.id,
        ...commentaryData,
        period: parsedPeriod,
      })
      .returning();

    res.status(201).json({ data: entry });
  } catch (error) {
    console.error({ error });
    return res.status(500).json({ error: 'Failed to create commentary' });
  }
});

export default commentaryRouter;
