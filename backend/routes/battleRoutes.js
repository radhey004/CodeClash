import express from 'express';
import { createBattle, submitCode, getBattle, getUserBattles } from '../controllers/battleController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', protect, createBattle);
router.post('/submit', protect, submitCode);
router.get('/user', protect, getUserBattles);
router.get('/:id', protect, getBattle);

export default router;
