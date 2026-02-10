import mongoose from 'mongoose';

const friendSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'blocked'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate friend requests
friendSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Static method to check if users are friends
friendSchema.statics.areFriends = async function(userId1, userId2) {
  const friendship = await this.findOne({
    $or: [
      { requester: userId1, recipient: userId2, status: 'accepted' },
      { requester: userId2, recipient: userId1, status: 'accepted' }
    ]
  });
  return !!friendship;
};

// Static method to get all friends for a user
friendSchema.statics.getFriends = async function(userId) {
  const friendships = await this.find({
    $or: [
      { requester: userId, status: 'accepted' },
      { recipient: userId, status: 'accepted' }
    ]
  }).populate('requester recipient', 'username level xp wins losses');

  return friendships.map(friendship => {
    const friend = friendship.requester._id.toString() === userId.toString()
      ? friendship.recipient
      : friendship.requester;
    return {
      ...friend.toObject(),
      friendshipId: friendship._id,
      friendsSince: friendship.updatedAt
    };
  });
};

// Static method to get pending friend requests
friendSchema.statics.getPendingRequests = async function(userId) {
  const requests = await this.find({
    recipient: userId,
    status: 'pending'
  }).populate('requester', 'username level xp wins losses');

  return requests.map(req => ({
    requestId: req._id,
    user: req.requester,
    createdAt: req.createdAt
  }));
};

// Static method to get sent friend requests
friendSchema.statics.getSentRequests = async function(userId) {
  const requests = await this.find({
    requester: userId,
    status: 'pending'
  }).populate('recipient', 'username level xp wins losses');

  return requests.map(req => ({
    requestId: req._id,
    user: req.recipient,
    createdAt: req.createdAt
  }));
};

export default mongoose.model('Friend', friendSchema);
