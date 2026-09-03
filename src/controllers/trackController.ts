import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { notify, formatEvent, nowUtc, clientIp } from '../utils/telegram';

// In-memory dedupe: skip the same IP for 60s so refresh/prefetch/bot noise
// doesn't flood Telegram. Keyed by IP+UA hash. On a single-instance server
// this is fine; behind a load balancer it dedupes per-instance only.
const RECENT_WINDOW_MS = 60_000;
const recent = new Map<string, number>();

setInterval(() => {
  const cutoff = Date.now() - RECENT_WINDOW_MS;
  for (const [key, ts] of recent) if (ts < cutoff) recent.delete(key);
}, 5 * 60_000).unref();

// @route POST /api/track/visit — public, no auth
export const trackVisit = asyncHandler(async (req: Request, res: Response) => {
  const ip = clientIp(req);
  const ua = String(req.headers['user-agent'] || '').slice(0, 120);
  const key = `${ip}|${ua}`;

  const last = recent.get(key);
  if (last && Date.now() - last < RECENT_WINDOW_MS) {
    res.json({ ok: true, deduped: true });
    return;
  }
  recent.set(key, Date.now());

  const { referrer, path } = req.body || {};

  notify(
    formatEvent('🟢', 'New visitor', {
      Path: path,
      Referrer: referrer,
      IP: ip,
      Agent: ua,
      Time: nowUtc(),
    })
  );

  res.json({ ok: true });
});
