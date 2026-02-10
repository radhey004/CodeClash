import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

dotenv.config();

const resetUserStats = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected\n');

    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    for (const user of users) {
      console.log(`Resetting stats for ${user.username}:`);
      console.log(`  Old: ${user.wins} wins, ${user.losses} losses, ${user.totalBattles} total`);
      
      // Reset battle stats since all battles were deleted
      user.wins = 0;
      user.losses = 0;
      user.totalBattles = 0;
      user.currentStreak = 0;
      user.longestStreak = 0;
      user.currentWinStreak = 0;
      user.longestWinStreak = 0;
      
      await user.save();
      console.log(`  New: ${user.wins} wins, ${user.losses} losses, ${user.totalBattles} total`);
    }

    console.log('\n✅ User stats reset complete');
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

resetUserStats();
