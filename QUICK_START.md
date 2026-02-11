# 🚀 Quick Start Guide

## Get CodeClash Running in Under 5 Minutes

This guide will have you battling opponents in real-time coding duels quickly. Perfect for first-time setup and testing.

---

## ✅ Prerequisites

Before starting, ensure you have:

- ✔️ **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- ✔️ **MongoDB** (v6 or higher) - Running locally or Atlas cloud
- ✔️ **Git** - [Download](https://git-scm.com/)
- ✔️ **Code Editor** - VS Code recommended
- ✔️ **2 Browser Windows** - For testing PvP battles

---

## 📥 Step 1: Clone & Install

### Clone Repository

```bash
git clone <your-repository-url> codeclash
cd codeclash
```

### Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install compiler dependencies  
cd "../code compiler/compilerd"
npm install

# Return to root
cd ../..
```

### Verify Installation

```bash
# Check Node version
node --version  # Should be >= v18

# Check MongoDB
mongosh  # Should connect successfully
```

---

## ⚙️ Step 2: Configure Environment

### Create .env File

Create a `.env` file in the **root directory**:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/codeclash

# JWT Secret (change this!)
JWT_SECRET=your-super-secret-key-minimum-32-characters-long

# Ports
PORT=5000

# Services
COMPILER_URL=https://codeclash-czhz.onrender.com
FRONTEND_URL=https://gocodeclash.vercel.app/

# Environment
NODE_ENV=development
```

### Seed Database with Problems

```bash
npm run seed
```

**Expected Output:**
```
Connected to MongoDB
Seeding problems...
✓ Two Sum (Easy)
✓ Reverse String (Easy)
✓ Palindrome Check (Easy)
✓ Valid Parentheses (Medium)
✓ Maximum Subarray (Medium)
Database seeded successfully!
```

---

## 🚀 Step 3: Start All Services

### Option A: Automated Startup (Recommended)

**Windows:**
```powershell
.\start.ps1
```

**Linux/macOS:**
```bash
chmod +x start.sh
./start.sh
```

This will automatically start all three services in separate windows.

### Option B: Manual Startup

**Terminal 1 - Compiler Service:**
```bash
cd "code compiler/compilerd"
npm start
```
✓ Should show: `Compiler service running on port 3000`

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```
✓ Should show: `Server running on port 5000` and `MongoDB Connected`

**Terminal 3 - Frontend:**
```bash
npm run dev
```
✓ Should show: `Local: https://gocodeclash.vercel.app/`

---

## 🎮 Step 4: Test the Battle System

### Create Two Test Accounts

**Browser Window 1 (Normal Mode):**

1. Open: https://gocodeclash.vercel.app/
2. Click **"Get Started"** or **"Register"**
3. Register with:
   - Username: `Warrior1`
   - Email: `warrior1@test.com`
   - Password: `password123`
4. Click **"Sign Up"**

**Browser Window 2 (Incognito/Private Mode):**

1. Open: https://gocodeclash.vercel.app/ (in Incognito)
2. Click **"Get Started"** or **"Register"**  
3. Register with:
   - Username: `Warrior2`
   - Email: `warrior2@test.com`
   - Password: `password123`
4. Click **"Sign Up"**

### Start a Battle

**In Browser Window 1 (Warrior1):**

1. From Dashboard, click **"PvP Battle"** button
2. Select difficulty: **Easy**
3. Click **"Find Match"**
4. Wait for match... (you should see "Searching for opponent...")

**In Browser Window 2 (Warrior2):**

1. From Dashboard, click **"PvP Battle"** button  
2. Select difficulty: **Easy** (MUST be same as Warrior1)
3. Click **"Find Match"**

**🎉 Match Found!**

Both players will see:
- "Match found!" notification
- Opponent's username
- "Entering battle arena..." message
- Automatic redirect to battle arena in 3 seconds

---

## ⚔️ Step 5: Battle & Win

### In the Battle Arena

You'll see:
- **Top Section:** Timer countdown and player cards
  - Your card (cyan/blue border)
  - Opponent card (red border)
- **Left Panel:** Problem description with test cases
- **Right Panel:** Monaco code editor

### Quick Win Solution (Two Sum Problem)

The first Easy problem is usually "Two Sum". Here's a Python solution:

```python
nums = list(map(int, input().split()))
target = int(input())

for i in range(len(nums)):
    for j in range(i + 1, len(nums)):
        if nums[i] + nums[j] == target:
            print(i, j)
            break
```

**Steps to Win:**

1. Select **Python** from language dropdown
2. **Paste** the solution above into the editor
3. Click **"Submit Code"** button
4. Wait for results...

### What Happens Next

**If you submit first and pass all tests:**
- ✅ **All test cases passed (3/3)**
- 🏆 **VICTORY!**
- 🎁 **+100 XP** (2x bonus for winning)
- 📈 Wins: 1, Losses: 0

**If opponent submits first:**
- ❌ **Defeat**
- 🎁 **+25 XP** (consolation prize)  
- 📉 Wins: 0, Losses: 1

Both players can see:
- Real-time opponent progress
- Test results as they happen
- Final battle outcome

---

## ✅ Verify Everything Works

### Check Dashboard Stats

Both players should click **"Back to Dashboard"** or navigate to Dashboard:

**Warrior1 (Winner):**
- Level might increase
- XP bar filled
- Wins: 1
- Losses: 0
- Recent battles shows the match

**Warrior2 (Loser):**
- Small XP increase
- Wins: 0  
- Losses: 1
- Recent battles shows the match

### Check Browser Console

Open DevTools (F12) → Console tab

You should see Socket.IO events:
```
Connected to matchmaking server
Joined queue for easy
Match found! battleId: xxx
Connected to battle server
Joined battle room
```

No errors should appear!

---

## 🐛 Troubleshooting

### Problem: "No match found"

**Cause:** Different difficulties selected or timing issue

**Fix:**
- Make sure BOTH players select the **same difficulty**
- Click "Find Match" within 30 seconds of each other
- Refresh and try again

### Problem: "Cannot connect to backend"

**Cause:** Backend server not running

**Fix:**
```bash
cd backend
npm run dev
```

Check Terminal 2 for "Server running on port 5000"

### Problem: "Compiler service unavailable"

**Cause:** Compiler service not running

**Fix:**
```bash
cd "code compiler/compilerd"
npm start
```

Check Terminal 1 for "Compiler service running on port 3000"

### Problem: "Port 5000 already in use"

**Cause:** Previous process didn't shut down properly

**Fix (Windows):**
```powershell
netstat -ano | findstr :5000
taskkill /PID <process_id> /F
```

**Fix (Linux/Mac):**
```bash
lsof -i :5000
kill -9 <process_id>
```

### Problem: "MongoDB connection failed"

**Cause:** MongoDB not running

**Fix (Windows):**
```powershell
net start MongoDB
```

**Fix (Linux):**
```bash
sudo systemctl start mongod
```

**Fix (Mac):**
```bash
brew services start mongodb-community
```

Or use MongoDB Atlas cloud database

---

## 🎯 Next Steps

### Try Different Scenarios

**1. Both Players Submit Wrong Code:**
- Both see "Failed (1/3)" or similar
- Both can retry until someone wins
- Shows real competition!

**2. Test Different Languages:**
- Try solving in Java, C++, JavaScript
- Each language has starter templates
- Tests work the same across all languages

**3. Practice Mode:**
- Click "Practice" instead of "PvP Battle"
- Solve problems solo
- No opponent, no pressure
- Still earn XP

### Explore More Features

- **Leaderboard:** See top players globally
- **Friends:** Add friends and track them
- **Profile:** View your stats and progress
- **Recent Battles:** See battle history

### Add More Problems

Edit `backend/scripts/seedProblems.js` and add your own:

```javascript
{
  title: "Fibonacci Sequence",
  description: "Calculate nth Fibonacci number",
  difficulty: "medium",
  testCases: [
    { input: "5", output: "5" },
    { input: "10", output: "55" },
  ],
  xpReward: 75
}
```

Then run:
```bash
cd backend
node scripts/seedProblems.js
```

---

## 📊 System Architecture (Simple View)

```
    Browser 1              Browser 2
    (Warrior1)            (Warrior2)
        │                     │
        └─────WebSocket───────┘
                 │
            ┌────▼────┐
            │ Backend │ ←── MongoDB
            │ Node.js │ 
            └────┬────┘
                 │
            ┌────▼────┐
            │Compiler │
            │ Service │
            └─────────┘
```

**Communication Flow:**
1. Both players connect via WebSocket
2. Backend matches them together
3. Players join same battle room
4. Code submissions sent to compiler
5. Results broadcast to both players
6. Winner determined and stats updated

---

## 📚 Additional Resources

- 📖 **[README.md](./README.md)** - Full project overview and features
- 🏗️ **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and flow diagrams
- 🚀 **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide

---

## 🎓 What You've Accomplished

Congratulations! You've successfully:

- ✅ Set up a full-stack real-time application
- ✅ Configured MongoDB database
- ✅ Implemented WebSocket communication
- ✅ Created and tested PvP battles
- ✅ Learned Socket.IO basics
- ✅ Understood matchmaking systems

---

## 💡 Pro Tips

1. **Debug Mode:** Open browser DevTools (F12) → Console to see Socket events
2. **Multiple Tests:** Use different browsers for more than 2 players
3. **Database View:** Use MongoDB Compass to visualize your data
4. **Code Quality:** Check `backend/services/` for business logic
5. **Customization:** Modify problems in `backend/scripts/seedProblems.js`

---

## 🎯 Challenge Yourself

Now that you have it working, try:

- [ ] Add a new programming language (e.g., Ruby, Go)
- [ ] Create custom problems
- [ ] Implement a tournament bracket system
- [ ] Add real-time chat in battles
- [ ] Create difficulty-based XP multipliers
- [ ] Build an admin dashboard
- [ ] Add battle replays
- [ ] Implement spectator mode

---

<div align="center">

**🎊 You're Ready to Battle! 🎊**

Need help? Check [DEPLOYMENT.md](./DEPLOYMENT.md) for troubleshooting or open an issue!

[⬆ Back to Top](#-quick-start-guide)

</div>
