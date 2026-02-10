import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriends,
  getPendingRequests,
  getSentRequests,
  searchUsers
} from '../controllers/friendController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Search for users
router.get('/search', searchUsers);

// Get friends and requests
router.get('/', getFriends);
router.get('/pending', getPendingRequests);
router.get('/sent', getSentRequests);

// Send friend request
router.post('/request', sendFriendRequest);

// Accept friend request
router.post('/accept/:requestId', acceptFriendRequest);

// Decline friend request
router.post('/decline/:requestId', declineFriendRequest);

// Cancel sent friend request
router.delete('/cancel/:requestId', cancelFriendRequest);

// Remove friend
router.delete('/:friendshipId', removeFriend);

export default router;
