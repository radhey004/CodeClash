import Friend from '../models/Friend.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Send a friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.user._id;

    // Validate recipientId
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: 'Invalid recipient ID' });
    }

    // Check if trying to add themselves
    if (requesterId.toString() === recipientId) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already friends or request already exists
    const existingFriendship = await Friend.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return res.status(400).json({ message: 'Already friends' });
      } else if (existingFriendship.status === 'pending') {
        return res.status(400).json({ message: 'Friend request already sent' });
      } else if (existingFriendship.status === 'blocked') {
        return res.status(400).json({ message: 'Cannot send friend request' });
      }
    }

    // Create friend request
    const friendRequest = await Friend.create({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending'
    });

    const populatedRequest = await Friend.findById(friendRequest._id)
      .populate('requester', 'username level xp')
      .populate('recipient', 'username level xp');

    res.status(201).json({
      message: 'Friend request sent',
      request: populatedRequest
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ message: error.message });
  }
};

// Accept friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const friendRequest = await Friend.findById(requestId);
    
    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    // Verify the current user is the recipient
    if (friendRequest.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    friendRequest.status = 'accepted';
    await friendRequest.save();

    const populatedRequest = await Friend.findById(friendRequest._id)
      .populate('requester', 'username level xp wins losses')
      .populate('recipient', 'username level xp wins losses');

    res.json({
      message: 'Friend request accepted',
      friendship: populatedRequest
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ message: error.message });
  }
};

// Decline friend request
export const declineFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const friendRequest = await Friend.findById(requestId);
    
    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    // Verify the current user is the recipient
    if (friendRequest.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Delete the request instead of marking as declined
    await Friend.findByIdAndDelete(requestId);

    res.json({ message: 'Friend request declined' });
  } catch (error) {
    console.error('Error declining friend request:', error);
    res.status(500).json({ message: error.message });
  }
};

// Cancel sent friend request
export const cancelFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const friendRequest = await Friend.findById(requestId);
    
    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    // Verify the current user is the requester
    if (friendRequest.requester.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    await Friend.findByIdAndDelete(requestId);

    res.json({ message: 'Friend request cancelled' });
  } catch (error) {
    console.error('Error cancelling friend request:', error);
    res.status(500).json({ message: error.message });
  }
};

// Remove friend
export const removeFriend = async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.user._id;

    const friendship = await Friend.findById(friendshipId);
    
    if (!friendship) {
      return res.status(404).json({ message: 'Friendship not found' });
    }

    // Verify the current user is part of the friendship
    const isRequester = friendship.requester.toString() === userId.toString();
    const isRecipient = friendship.recipient.toString() === userId.toString();
    
    if (!isRequester && !isRecipient) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (friendship.status !== 'accepted') {
      return res.status(400).json({ message: 'Not friends' });
    }

    await Friend.findByIdAndDelete(friendshipId);

    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get friends list
export const getFriends = async (req, res) => {
  try {
    const userId = req.user._id;
    const friends = await Friend.getFriends(userId);
    res.json({ friends });
  } catch (error) {
    console.error('Error getting friends:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get pending friend requests (received)
export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const requests = await Friend.getPendingRequests(userId);
    res.json({ requests });
  } catch (error) {
    console.error('Error getting pending requests:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get sent friend requests
export const getSentRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const requests = await Friend.getSentRequests(userId);
    res.json({ requests });
  } catch (error) {
    console.error('Error getting sent requests:', error);
    res.status(500).json({ message: error.message });
  }
};

// Search users to add as friends
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user._id;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: 'Query must be at least 2 characters' });
    }

    // Find users matching the query
    const users = await User.find({
      username: { $regex: query, $options: 'i' },
      _id: { $ne: userId } // Exclude current user
    })
    .select('username level xp wins losses')
    .limit(20);

    // Get friendship status for each user
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const friendship = await Friend.findOne({
          $or: [
            { requester: userId, recipient: user._id },
            { requester: user._id, recipient: userId }
          ]
        });

        let status = 'none';
        let friendshipId = null;
        
        if (friendship) {
          if (friendship.status === 'accepted') {
            status = 'friends';
            friendshipId = friendship._id;
          } else if (friendship.status === 'pending') {
            status = friendship.requester.toString() === userId.toString() 
              ? 'request-sent' 
              : 'request-received';
            friendshipId = friendship._id;
          }
        }

        return {
          ...user.toObject(),
          friendshipStatus: status,
          friendshipId
        };
      })
    );

    res.json({ users: usersWithStatus });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: error.message });
  }
};
