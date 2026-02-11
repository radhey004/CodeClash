# AI Quick Reference Guide

Quick reference for using AI features in CodeClash.

## 🔧 Setup (5 minutes)

### 1. Environment Variables

**Backend** (`backend/.env`):
```env
GEMINI_API_KEY=AIzaSyCugupfo_gaymzLN_YwrcsGLiYo3RS4vVg
```

**Compilerd** (`compilerd/.env`):
```env
GEMINI_API_KEY=AIzaSyCugupfo_gaymzLN_YwrcsGLiYo3RS4vVg
LANGFUSE_PUBLIC_KEY=pk-lf-... (optional)
LANGFUSE_SECRET_KEY=sk-lf-... (optional)
LANGFUSE_BASE_URL=https://cloud.langfuse.com (optional)
```

### 2. Install Dependencies
```bash
cd backend && npm install
cd ../compilerd && npm install
```

### 3. Start Services
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Compilerd  
cd compilerd && npm start

# Terminal 3 - Frontend
npm run dev
```

## 📋 API Usage

### Generate Problem

**Where**: `backend/services/geminiService.js`

```javascript
import { generateProblem } from '../services/geminiService.js';

// Generate problem based on user profile
const problem = await generateProblem({
  league: 'Gold League',
  level: 15,
  xp: 2500
});

// Returns:
// {
//   title: "Problem Title",
//   description: "Problem description...",
//   difficulty: "Medium",
//   constraints: [...],
//   testCases: [{input, output, isHidden}, ...],
//   timeLimit: 300,
//   xpReward: 75,
//   editorial: {...}
// }
```

### Generate Editorial

**Where**: `backend/services/geminiService.js`

```javascript
import { generateEditorial } from '../services/geminiService.js';

// Generate editorial after battle
const editorial = await generateEditorial(
  problem,                    // Problem object
  { code, language },        // User's solution
  { testCasesPassed, totalTestCases, executionTime }  // Stats
);

// Returns:
// {
//   summary: "Brief explanation...",
//   approach: "Step-by-step solution...",
//   optimalSolution: "code example...",
//   timeComplexity: "O(n)",
//   spaceComplexity: "O(1)",
//   keyTakeaways: ["point 1", "point 2", ...],
//   commonMistakes: ["mistake 1", "mistake 2", ...]
// }
```

## 🎮 User Flow

### Practice Mode
1. User clicks "Practice"
2. ✨ AI generates personalized problem
3. User solves problem
4. ✨ AI generates editorial on completion
5. User views editorial and learns

### Ranked Battle
1. User joins matchmaking queue
2. Match found with opponent
3. ✨ AI generates problem for both players
4. Battle starts
5. First to complete wins
6. ✨ AI generates editorial for both

### Friend Challenge
1. User sends challenge to friend
2. Friend accepts
3. ✨ AI generates problem based on avg skill
4. Battle starts
5. Winner determined
6. ✨ AI generates editorial

## 🔍 Debugging

### Check Problem Generation
```bash
# Backend logs
cd backend
npm run dev

# Look for:
# "Generating AI problem for user: {...}"
# "Problem generated successfully"
```

### Check Editorial Generation
```bash
# Backend logs should show:
# "Generating AI editorial for battle: ..."
# "Editorial generated successfully"
```

### Langfuse Dashboard
If configured, check:
- https://cloud.langfuse.com
- View traces and generations
- Monitor token usage
- Track performance

## 🛠️ Common Tasks

### Adjust Problem Difficulty

Edit `backend/services/geminiService.js`:

```javascript
// Modify difficulty context
if (league === 'Unranked' || league === 'Bronze League') {
  difficulty = 'Easy';
  difficultyContext = 'beginner-friendly...'; // Customize here
}
```

### Customize Editorial Style

Edit `backend/services/geminiService.js`:

```javascript
// Modify the prompt for editorials
const prompt = `Generate a comprehensive, modern post-match editorial...
// Add your customizations here
`;
```

### Change AI Model

Edit `backend/services/geminiService.js`:

```javascript
// Change from gemini-1.5-flash to another model
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-pro'  // Or 'gemini-1.5-flash-8b'
});
```

## 📊 Monitoring

### Check AI Usage

**Via Logs**:
```bash
grep "Gemini" backend/logs/*.log
```

**Via Langfuse** (if configured):
- Dashboard: https://cloud.langfuse.com
- Metrics: Generations, tokens, costs
- Traces: Full request/response details

### Performance Metrics

Typical response times:
- Problem generation: 2-5 seconds
- Editorial generation: 3-7 seconds
- Fallback to DB: <100ms

## ⚠️ Troubleshooting

### "Failed to generate problem"

**Check**:
1. GEMINI_API_KEY is set correctly
2. API key is active (visit aistudio.google.com)
3. Internet connection
4. Backend logs for detailed error

**Solution**:
- System will fallback to existing DB problems
- Fix API key and restart

### "Editorial not showing"

**Check**:
1. Battle completed successfully
2. Gemini API key configured
3. Socket connection active
4. Browser console for errors

**Solution**:
- Check backend socket logs
- Verify battle completion event
- Test with practice mode first

### High Latency

**If AI generation is slow**:
1. Check network connectivity
2. Switch to faster model (gemini-1.5-flash-8b)
3. Monitor Langfuse for bottlenecks
4. Consider caching generated problems

## 🎯 Best Practices

### ✅ Do's
- Cache generated problems in database
- Handle AI errors gracefully
- Use fallback to existing problems
- Monitor API usage and costs
- Test AI generation in practice mode first

### ❌ Don'ts
- Don't expose API keys in frontend
- Don't rely solely on AI (have fallbacks)
- Don't ignore error handling
- Don't skip API usage monitoring

## 📚 Key Files

```
backend/
  services/geminiService.js       # Core AI logic
  controllers/problemController.js # Problem endpoints
  socket/battleSocket.js          # Battle logic + AI

compilerd/
  helpers/geminiInstance.js       # Gemini + Langfuse
  configs/app.config.js           # Configuration

Documentation/
  AI_FEATURES.md                  # Full documentation
  AI_MIGRATION_GUIDE.md           # Setup guide
  IMPLEMENTATION_SUMMARY.md       # What was built
```

## 🚀 Quick Commands

```bash
# Install
npm install

# Start backend with AI
cd backend && npm run dev

# Start compiler
cd compilerd && npm start

# Check logs
tail -f backend/logs/combined.log

# Test problem generation
curl https://codeclash-2-g5un.onrender.com/api/problems/random

# Monitor Langfuse
open https://cloud.langfuse.com
```

## 💡 Tips

1. **Start with practice mode** to test AI generation
2. **Monitor Langfuse** for performance insights
3. **Cache problems** to reduce API calls
4. **Set usage alerts** in Google Cloud Console
5. **Test fallbacks** by temporarily disabling API

---

**Need More Help?**
- Full docs: `AI_FEATURES.md`
- Setup guide: `AI_MIGRATION_GUIDE.md`
- Implementation details: `IMPLEMENTATION_SUMMARY.md`
