import 'dotenv/config';
import arcjet, { detectBot, shield, slidingWindow } from '@arcjet/node';

const arcjetKey = process.env.ARCJET_KEY;

const isDryRun =
  process.env.ARCJET_ENV === 'DRY_RUN' ||
  process.env.ARCJET_ENV === 'development';

const observeMode = isDryRun ? 'DRY_RUN' : 'LIVE';
const enforceMode = 'LIVE';

if (!arcjetKey) throw new Error('ARCJET_KEY environment variable is missing.');

export const httpArcjet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({ mode: observeMode }),
        detectBot({
          mode: observeMode,
          allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'],
        }),
        slidingWindow({ mode: enforceMode, interval: '10s', max: 50 }),
      ],
    })
  : null;

export const wsArcjet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({ mode: observeMode }),
        detectBot({
          mode: observeMode,
          allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'],
        }),
        slidingWindow({ mode: enforceMode, interval: '2s', max: 5 }),
      ],
    })
  : null;

export function securityMiddleware() {
  return async (req, res, next) => {
    if (!httpArcjet) return next();

    try {
      const decision = await httpArcjet.protect(req);

      if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          return res.status(429).json({ error: 'Too many requests.' });
        }

        return res.status(403).json({ error: 'Forbidden.' });
      }
    } catch (e) {
      console.error('Arcjet middleware error', e);
      return res.status(503).json({ error: 'Service Unavailable' });
    }

    next();
  };
}
