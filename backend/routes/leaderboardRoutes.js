import express from 'express';
import { getLeaderboard, getMyLeague, getTopPlayers } from '../controllers/leaderboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getLeaderboard);
router.get('/my-league', protect, getMyLeague);
router.get('/top-players', protect, getTopPlayers);

export default router;
