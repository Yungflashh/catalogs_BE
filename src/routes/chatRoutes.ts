import { Router } from 'express';
import { sendChatMessage, getMyMessages, telegramWebhook } from '../controllers/chatController';
import { optionalProtect } from '../middleware/auth';

const router = Router();

router.post('/send', optionalProtect, sendChatMessage);
router.get('/mine', getMyMessages);
router.post('/webhook', telegramWebhook);

export default router;
