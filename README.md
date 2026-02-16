# 🎮 CodeClash

<div align="center">

### Real-Time Competitive Coding Arena
**Where Developers Battle Through Code**

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)

[🚀 Quick Start](./QUICK_START.md) • [🏗️ Architecture](./ARCHITECTURE.md)

</div>

---

## 🌟 What is CodeClash?

CodeClash is a next-generation competitive programming platform that brings the excitement of real-time PvP battles to the coding world. Challenge opponents worldwide, solve algorithmic problems under pressure, and climb the global leaderboard.

### 🎯 Core Features

- 🤖 **AI-Generated Problems** - Gemini AI creates personalized coding challenges based on your skill level
- 📚 **Smart Editorials** - Get AI-powered post-match analysis with optimal solutions and learning insights
- ⚔️ **1v1 Real-Time Battles** - Face off against developers in live coding duels
- 🌐 **Multi-Language Support** - Code in Python, Java, C++, C, or JavaScript  
- ⚡ **Instant Code Execution** - Blazing-fast local compiler with sub-second response
- 🎮 **Smart Matchmaking** - Difficulty-based queue system for fair matches
- 📊 **XP & Leveling System** - Progress through 50 levels, earn rewards
- 🏆 **Global Leaderboards** - Compete for the top rank worldwide
- 💎 **Monaco Editor** - Professional code editor powered by VS Code
- 🔐 **Secure Authentication** - JWT-based auth with bcrypt password encryption

---

## ⚡ Quick Start

### Prerequisites
```bash
Node.js >= 18.0
MongoDB >= 6.0  
Git
```

### One-Command Setup

```bash
# Clone repository
git clone <your-repo-url> codeclash && cd codeclash

# Install all dependencies
npm install && cd backend && npm install && cd "../code compiler/compilerd" && npm install && cd ../..

# Start all services (Windows)
.\start.ps1

# Start all services (Linux/Mac)
chmod +x start.sh && ./start.sh
```

### Manual Setup

1. **Create `.env` file in root:**
```env
MONGODB_URI=mongodb://localhost:27017/codeclash
JWT_SECRET=your-super-secret-key-min-32-characters
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
COMPILER_URL=https://codeclash-czhz.onrender.com
FRONTEND_URL=https://gocodeclash.vercel.app/
```

2. **Get Gemini API Key:**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in and create an API key
   - Add to `.env` file


📖 **Detailed guide:** See [QUICK_START.md](./QUICK_START.md)

---

## 🎮 How It Works

```
1️⃣ Create Account → 2️⃣ Join Queue → 3️⃣ Get Matched → 4️⃣ Code Battle → 5️⃣ Earn XP & Rank Up
```

1. **Register** - Create your account in seconds
2. **Find Match** - Choose difficulty and enter matchmaking queue  
3. **Battle** - Solve algorithmic problems faster than your opponent
4. **Win** - First to pass all test cases wins and earns 2x XP
5. **Climb** - Level up and dominate the global leaderboard

---

## 🛠️ Technology Stack

<table>
<tr>
<td width="33%" valign="top">

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- Socket.IO Client
- Monaco Editor
- React Router v6
- Vite

</td>
<td width="33%" valign="top">

### Backend  
- Node.js + Express
- Socket.IO Server
- MongoDB + Mongoose
- JWT + bcryptjs
- CORS

</td>
<td width="33%" valign="top">

### Compiler
- Node.js Runtime
- Child Process Isolation
- Multi-language Support
- Memory/Time Limits
- Test Case Validation

</td>
</tr>
</table>

---

## 📁 Project Structure

```
codeclash/
│
├─ frontend/              # React + TypeScript SPA
│  ├─ pages/             # Arena, Dashboard, Matchmaking, etc.
│  ├─ components/        # Navbar, ProtectedRoute, Modals
│  ├─ config/            # Language configurations
│  ├─ context/           # Auth context
│  └─ services/          # API client
│
├─ backend/              # Express + Socket.IO Server
│  ├─ controllers/       # Auth, Battle, Leaderboard logic
│  ├─ models/            # User, Battle, Problem schemas
│  ├─ routes/            # REST API routes
│  ├─ services/          # Code execution, Matchmaking
│  ├─ socket/            # WebSocket battle handlers
│  ├─ middleware/        # JWT auth middleware
│  └─ scripts/           # Database seed scripts
│
└─ code compiler/compilerd/  # Code Execution Service
   ├─ controllers/       # Code compilation controller
   ├─ services/          # Language-specific executors
   └─ configs/           # Compiler configurations
```

---

## 🎯 Key Features

### ⚔️ Battle System
- **Real-time PvP** - Live 1v1 coding battles with instant updates
- **Test Validation** - Multiple test cases with hidden edge cases  
- **Winner Detection** - First to pass all tests wins
- **Live Updates** - See opponent progress in real-time

### 💻 Code Editor
- **Monaco Editor** - Same editor as VS Code
- **5 Languages** - Python, Java, C++, C, JavaScript
- **IntelliSense** - Auto-completion and syntax highlighting
- **Themes** - Light/Dark mode support

### 🎮 Matchmaking  
- **Difficulty Queues** - Easy, Medium, Hard
- **Fair Pairing** - Match players of similar skill
- **Queue Status** - Real-time queue size updates
- **Auto-matching** - Instant pairing when opponent found

### 📈 Progression
- **50 Levels** - Level 1 to 50 progression system
- **XP System** - Earn XP from battles (2x for wins, 0.5x for losses)
- **Global Leaderboard** - Compete for top rank
- **Win/Loss Stats** - Track your performance

### 👥 Social
- **Friends System** - Add friends and track their progress
- **Battle History** - View recent battles
- **Public Profiles** - Check out other players' stats


---

## 🚀 Use Cases

- **Portfolio Project** - Showcase full-stack + real-time capabilities
- **Learning Platform** - Master Socket.IO, MongoDB, React
- **Interview Prep** - Practice algorithmic problems competitively  
- **Coding Competitions** - Host live coding tournaments
- **Educational Tool** - Teach data structures and algorithms


---

## 🙏 Acknowledgments

- **Monaco Editor** - Microsoft's incredible code editor
- **Socket.IO** - Real-time communication made easy
- **Judge0** - Inspiration for code execution architecture

---

## 📞 Support & Contact

- 🐛 **Report Bugs** - Open an issue on GitHub
- 💡 **Feature Requests** - Share your ideas via issues
- 📧 **Contact** - Reach out for questions or collaboration

---

<div align="center">

### ⭐ Star this repository if you found it helpful!

**Built with 💻 and ☕ by passionate developers**

[⬆ Back to Top](#-codeclash)

</div>
