import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Script to update ranks for ALL users based on their current rankedXP
const updateAllRanks = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to update`);

    let updated = 0;
    for (const user of users) {
      const oldRank = user.rank;
      
      // Update rank based on current rankedXP
      user.updateRank();
      
      await user.save();
      updated++;
      
      console.log(`Updated ${user.username}: rankedXP=${user.rankedXP}, rank=${oldRank} → ${user.rank}`);
    }

    console.log(`\n✅ Successfully updated ranks for ${updated} users`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating ranks:', error);
    process.exit(1);
  }
};

updateAllRanks();
