import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import User from '../models/User.js';

const isLastMondayOfMonth = (date) => {
  const testDate = new Date(date);
  
  // Check if it's Monday (0 = Sunday, 1 = Monday, etc.)
  if (testDate.getDay() !== 1) {
    return false;
  }
  
  // Check if adding 7 days would go into next month
  const nextWeek = new Date(testDate);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  return nextWeek.getMonth() !== testDate.getMonth();
};

const performSeasonReset = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/codeclash');
    console.log('Connected to MongoDB');

    const today = new Date();
    console.log(`\n🗓️  Checking date: ${today.toDateString()}`);
    
    // Check if today is the last Monday of the month
    if (!isLastMondayOfMonth(today)) {
      console.log('❌ Not the last Monday of the month. Season reset not performed.');
      await mongoose.connection.close();
      return;
    }

    console.log('✅ Today is the last Monday of the month!');
    console.log('🔄 Starting season reset...\n');

    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to process`);

    let legendPlayersReset = 0;
    let regularPlayersReset = 0;
    let totalLegendTrophiesAwarded = 0;

    for (const user of users) {
      const oldLeague = user.league;
      const oldTrophies = user.trophies;

      // Perform season reset
      user.resetForSeason();
      await user.save();

      if (oldTrophies > 4000) {
        const awarded = oldTrophies - 4000;
        legendPlayersReset++;
        totalLegendTrophiesAwarded += awarded;
        console.log(`  🏆 ${user.username}: ${oldLeague} (${oldTrophies} trophies) → Reset to 4000, awarded ${awarded} Legend Trophies`);
      } else {
        regularPlayersReset++;
      }
    }

    console.log('\n📈 Season Reset Summary:');
    console.log(`  • Total users reset: ${users.length}`);
    console.log(`  • Legend players reset: ${legendPlayersReset}`);
    console.log(`  • Regular players reset: ${regularPlayersReset}`);
    console.log(`  • Total Legend Trophies awarded: ${totalLegendTrophiesAwarded}`);
    console.log('\n✨ Season reset completed successfully!');
    console.log('💡 Players must complete one PvP battle to be placed in a league.\n');

    await mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('❌ Error during season reset:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// If run directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  performSeasonReset();
}

export { performSeasonReset, isLastMondayOfMonth };
