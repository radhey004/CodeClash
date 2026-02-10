import express from 'express';
import { getProblems, getProblem, getRandomProblem } from '../controllers/problemController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getProblems);
router.get('/random', protect, getRandomProblem);
router.get('/:id', protect, getProblem);

export default router;
