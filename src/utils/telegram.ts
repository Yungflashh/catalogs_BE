import logger from './logger';

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT = process.env.TELEGRAM_CHAT_ID;
const TG_ENABLED = Boolean(TG_TOKEN && TG_CHAT);

let warnedMissing = false;

// Fire-and-forget Telegram notification. Never throws. Silent no-op when
// TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing so dev without credentials
// keeps working. Uses global fetch (Node 18+).
export function notify(html: string): void {
  if (!TG_ENABLED) {
    if (!warnedMissing) {
      warnedMissing = true;
      logger.info('[telegram] notifications disabled (env vars missing)');
    }
    return;
  }

  const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;
  const body = JSON.stringify({
    chat_id: TG_CHAT,
    text: html,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        logger.warn('[telegram] send failed', {
          status: res.status,
          body: text.slice(0, 200),
        });
      }
    })
    .catch((err) => {
      logger.warn('[telegram] send error', { error: (err as Error).message });
    });
}

const escapeHtml = (v: unknown): string =>
  String(v ?? '—')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// Build a Telegram HTML message: emoji + title, then <b>Key:</b> <code>value</code> lines.
export function formatEvent(
  emoji: string,
  title: string,
  fields: Record<string, unknown>
): string {
  const lines = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `<b>${escapeHtml(k)}:</b> <code>${escapeHtml(v)}</code>`)
    .join('\n');
  return `${emoji} <b>${escapeHtml(title)}</b>\n\n${lines}`;
}

export function nowUtc(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC';
}

// Awaited send that returns Telegram's message_id, so callers (chat bridge)
// can map a Telegram message → their internal thread for reply routing.
// Returns null on failure — caller decides how to degrade.
export async function sendAndReturnId(html: string): Promise<number | null> {
  if (!TG_ENABLED) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHAT,
        text: html,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      logger.warn('[telegram] sendAndReturnId failed', { status: res.status, body: body.slice(0, 200) });
      return null;
    }
    const data = (await res.json()) as { ok: boolean; result?: { message_id: number } };
    return data.result?.message_id ?? null;
  } catch (err) {
    logger.warn('[telegram] sendAndReturnId error', { error: (err as Error).message });
    return null;
  }
}

// Best-effort client IP: honors X-Forwarded-For (first hop) then req.ip.
export function clientIp(req: {
  headers: Record<string, unknown>;
  ip?: string;
  socket?: { remoteAddress?: string };
}): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) return fwd.split(',')[0].trim();
  if (Array.isArray(fwd) && fwd[0]) return String(fwd[0]).split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
}
