import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Chat } from '../models/Chat';
import { ChatMessage } from '../models/ChatMessage';
import { AuthRequest } from '../middleware/auth';
import { sendAndReturnId, clientIp, nowUtc } from '../utils/telegram';
import logger from '../utils/logger';

const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

const esc = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// Serialize a chat message for the client — trim internal fields.
const serialize = (m: any) => ({
  _id: m._id,
  from: m.from,
  text: m.text,
  createdAt: m.createdAt,
});

// @route POST /api/chat/send — public (session-based)
export const sendChatMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { sessionId, text, name, email } = req.body || {};
  if (!sessionId || typeof sessionId !== 'string' || sessionId.length < 8) {
    res.status(400);
    throw new Error('Invalid sessionId');
  }
  const body = (text || '').toString().trim();
  if (!body) {
    res.status(400);
    throw new Error('Message text required');
  }
  if (body.length > 2000) {
    res.status(400);
    throw new Error('Message too long (max 2000 chars)');
  }

  // Find or create the chat thread. Attach logged-in user if we have one.
  let chat = await Chat.findOne({ sessionId });
  if (!chat) {
    chat = await Chat.create({
      sessionId,
      user: req.user?._id,
      name: name || req.user?.name,
      email: email || req.user?.email,
    });
  } else {
    // Backfill contact info on subsequent messages if the user just provided it.
    let dirty = false;
    if (!chat.user && req.user?._id) { chat.user = req.user._id; dirty = true; }
    if (!chat.name && (name || req.user?.name)) { chat.name = name || req.user?.name; dirty = true; }
    if (!chat.email && (email || req.user?.email)) { chat.email = email || req.user?.email; dirty = true; }
    if (dirty) await chat.save();
  }

  const message = await ChatMessage.create({ chat: chat._id, from: 'user', text: body });

  // Build the Telegram payload. Long-press this msg → Reply to answer them.
  const who = chat.name || chat.email || 'Anonymous';
  const contact = [chat.name, chat.email].filter(Boolean).join(' · ') || 'no contact';
  const tgBody =
    `💬 <b>New chat message</b>\n` +
    `<b>From:</b> ${esc(who)}\n` +
    `<b>Contact:</b> <code>${esc(contact)}</code>\n` +
    `<b>Session:</b> <code>${esc(chat.sessionId.slice(0, 8))}</code>\n` +
    `<b>IP:</b> <code>${esc(clientIp(req))}</code>\n` +
    `<b>Time:</b> <code>${esc(nowUtc())}</code>\n\n` +
    `${esc(body)}\n\n` +
    `<i>↩ Reply to this message to answer.</i>`;

  const tgId = await sendAndReturnId(tgBody);
  if (tgId) {
    message.telegramMessageId = tgId;
    await message.save();
  }

  chat.lastMessageAt = new Date();
  await chat.save();

  res.status(201).json({ ok: true, message: serialize(message) });
});

// @route GET /api/chat/mine?sessionId=X&since=<ISO>
export const getMyMessages = asyncHandler(async (req: Request, res: Response) => {
  const sessionId = String(req.query.sessionId || '');
  if (!sessionId || sessionId.length < 8) {
    res.status(400);
    throw new Error('Invalid sessionId');
  }
  const chat = await Chat.findOne({ sessionId });
  if (!chat) {
    res.json({ messages: [] });
    return;
  }

  const filter: Record<string, unknown> = { chat: chat._id };
  const sinceRaw = req.query.since ? String(req.query.since) : '';
  if (sinceRaw) {
    const since = new Date(sinceRaw);
    if (!isNaN(since.getTime())) filter.createdAt = { $gt: since };
  }

  const messages = await ChatMessage.find(filter).sort({ createdAt: 1 }).limit(200);
  res.json({ messages: messages.map(serialize) });
});

// @route POST /api/chat/webhook — called by Telegram when admin replies
// Auth: Telegram sets X-Telegram-Bot-Api-Secret-Token header to the value we
// registered via setWebhook. Reject any request without a matching header.
export const telegramWebhook = asyncHandler(async (req: Request, res: Response) => {
  if (!WEBHOOK_SECRET) {
    logger.warn('[chat] webhook hit but TELEGRAM_WEBHOOK_SECRET not configured');
    res.status(500).json({ ok: false });
    return;
  }
  const provided = req.headers['x-telegram-bot-api-secret-token'];
  if (provided !== WEBHOOK_SECRET) {
    logger.warn('[chat] webhook rejected: bad secret');
    res.status(401).json({ ok: false });
    return;
  }

  const update = req.body || {};
  const msg = update.message;
  const replyTo = msg?.reply_to_message;
  const text = (msg?.text || '').toString().trim();

  // We only care about replies to bot messages that map to a chat thread.
  // Silently ack any other update (commands, non-replies) so Telegram stops retrying.
  if (!msg || !replyTo || !text) {
    res.json({ ok: true, ignored: 'not-a-reply' });
    return;
  }

  const originalTgId = replyTo.message_id;
  const originalMessage = await ChatMessage.findOne({ telegramMessageId: originalTgId });
  if (!originalMessage) {
    res.json({ ok: true, ignored: 'no-mapping' });
    return;
  }

  const chat = await Chat.findById(originalMessage.chat);
  if (!chat) {
    res.json({ ok: true, ignored: 'chat-missing' });
    return;
  }

  await ChatMessage.create({ chat: chat._id, from: 'admin', text });
  chat.lastMessageAt = new Date();
  await chat.save();

  res.json({ ok: true });
});
