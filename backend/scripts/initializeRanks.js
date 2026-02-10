import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Script to initialize rankedXP and rank fields for existing users
const initializeRanks = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    // Find all users that don't have rankedXP or rank fields
    const users = await User.find({
      $or: [
        { rankedXP: { $exists: false } },
        { rank: { $exists: false } },
        { rankedXP: null },
        { rank: null }
      ]
    });

    console.log(`Found ${users.length} users to initialize`);

    let updated = 0;
    for (const user of users) {
      // Set rankedXP to 0 if not set
      if (user.rankedXP === undefined || user.rankedXP === null) {
        user.rankedXP = 0;
      }

      // Update rank based on rankedXP
      user.updateRank();
      
      await user.save();
      updated++;
      
      console.log(`Updated ${user.username}: rankedXP=${user.rankedXP}, rank=${user.rank}`);
    }

    console.log(`\n✅ Successfully initialized ranks for ${updated} users`);
    process.exit(0);
  } catch (error) {
    console.error('Error initializing ranks:', error);
    process.exit(1);
  }
};

initializeRanks();
