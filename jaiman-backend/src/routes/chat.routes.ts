import { Router } from 'express';
import multer from 'multer';
import { chatWithTutor, transcribeAudio } from '../controllers/chat.controller';
import { textToSpeech } from '../controllers/tts.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

// POST /api/chat  { messages: [{role, content}, ...] } -> { reply }
router.post('/', chatWithTutor);

// POST /api/chat/transcribe  multipart 'audio' -> { text }  (Groq Whisper, auto language)
router.post('/transcribe', upload.single('audio'), transcribeAudio);

// POST /api/chat/tts  { text, lang, rate } -> audio/mpeg  (Edge neural voices)
router.post('/tts', textToSpeech);

export default router;
