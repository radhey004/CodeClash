import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  level: {
    type: Number,
    default: 1
  },
  xp: {
    type: Number,
    default: 0
  },
  rankedXP: {
    type: Number,
    default: 0
  },
  rank: {
    type: String,
    default: 'Unranked'
  },
  league: {
    type: String,
    default: 'Unranked',
    enum: ['Unranked', 'Bronze League', 'Silver League', 'Gold League', 'Crystal League', 'Master League', 'Champion League', 'Legend League']
  },
  trophies: {
    type: Number,
    default: 0
  },
  legendTrophies: {
    type: Number,
    default: 0
  },
  seasonParticipated: {
    type: Boolean,
    default: false
  },
  lastSeasonReset: {
    type: Date,
    default: null
  },
  wins: {
    type: Number,
    default: 0
  },
  losses: {
    type: Number,
    default: 0
  },
  totalBattles: {
    type: Number,
    default: 0
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: Date,
    default: null
  },
  currentWinStreak: {
    type: Number,
    default: 0
  },
  longestWinStreak: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.addXP = function(xpAmount) {
  this.xp += xpAmount;
  const xpNeeded = this.level * 100;
  if (this.xp >= xpNeeded) {
    this.level += 1;
    this.xp = this.xp - xpNeeded;
  }
};

userSchema.methods.updateStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!this.lastActiveDate) {
    // First time activity
    this.currentStreak = 1;
    this.longestStreak = 1;
    this.lastActiveDate = today;
    return;
  }

  const lastActive = new Date(this.lastActiveDate);
  lastActive.setHours(0, 0, 0, 0);
  
  const diffTime = today - lastActive;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Same day, no change to streak
    return;
  } else if (diffDays === 1) {
    // Consecutive day, increment streak
    this.currentStreak += 1;
    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak;
    }
    this.lastActiveDate = today;
  } else {
    // Streak broken, reset to 1
    this.currentStreak = 1;
    this.lastActiveDate = today;
  }
};

userSchema.methods.incrementWinStreak = function() {
  this.currentWinStreak += 1;
  if (this.currentWinStreak > this.longestWinStreak) {
    this.longestWinStreak = this.currentWinStreak;
  }
};

userSchema.methods.resetWinStreak = function() {
  this.currentWinStreak = 0;
};

userSchema.methods.updateRank = function() {
  const xp = this.rankedXP;
  
  if (xp >= 4000) {
    this.rank = 'Legend League';
  } else if (xp >= 3200) {
    this.rank = 'Champion League';
  } else if (xp >= 2600) {
    this.rank = 'Master League';
  } else if (xp >= 2000) {
    this.rank = 'Crystal League';
  } else if (xp >= 1400) {
    this.rank = 'Gold League';
  } else if (xp >= 800) {
    this.rank = 'Silver League';
  } else if (xp >= 400) {
    this.rank = 'Bronze League';
  } else {
    this.rank = 'Unranked';
  }
};

userSchema.methods.addRankedXP = function(xpAmount) {
  this.rankedXP = Math.max(0, this.rankedXP + xpAmount);
  this.trophies = this.rankedXP; // Keep trophies in sync with rankedXP
  
  // Update both rank and league based on trophies
  const trophies = this.trophies;
  
  if (trophies >= 4000) {
    this.league = 'Legend League';
    this.rank = 'Legend League';
  } else if (trophies >= 3200) {
    this.league = 'Champion League';
    this.rank = 'Champion League';
  } else if (trophies >= 2600) {
    this.league = 'Master League';
    this.rank = 'Master League';
  } else if (trophies >= 2000) {
    this.league = 'Crystal League';
    this.rank = 'Crystal League';
  } else if (trophies >= 1400) {
    this.league = 'Gold League';
    this.rank = 'Gold League';
  } else if (trophies >= 800) {
    this.league = 'Silver League';
    this.rank = 'Silver League';
  } else if (trophies >= 400) {
    this.league = 'Bronze League';
    this.rank = 'Bronze League';
  } else {
    this.league = 'Unranked';
    this.rank = 'Unranked';
  }
  
  // Mark as season participated when they get placed in a league
  if (!this.seasonParticipated && trophies >= 0) {
    this.seasonParticipated = true;
  }
};

userSchema.methods.placeInLeague = function() {
  const trophies = this.trophies;
  
  if (trophies >= 4000) {
    this.league = 'Legend League';
  } else if (trophies >= 3200) {
    this.league = 'Champion League';
  } else if (trophies >= 2600) {
    this.league = 'Master League';
  } else if (trophies >= 2000) {
    this.league = 'Crystal League';
  } else if (trophies >= 1400) {
    this.league = 'Gold League';
  } else if (trophies >= 800) {
    this.league = 'Silver League';
  } else if (trophies >= 400) {
    this.league = 'Bronze League';
  } else {
    this.league = 'Unranked';
  }
  
  this.rank = this.league; // Keep rank in sync with league
  this.seasonParticipated = true;
};

userSchema.methods.resetForSeason = function() {
  // Handle Legend League special case
  if (this.trophies > 4000) {
    const excessTrophies = this.trophies - 4000;
    this.legendTrophies += excessTrophies;
    this.trophies = 4000;
    this.rankedXP = 4000;
  }
  
  // Reset league to unranked
  this.league = 'Unranked';
  this.rank = 'Unranked';
  this.seasonParticipated = false;
  this.lastSeasonReset = new Date();
};

export default mongoose.model('User', userSchema);
