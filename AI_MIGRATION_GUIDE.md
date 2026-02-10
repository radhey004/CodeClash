# AI Migration Guide

This guide explains the migration from static problems and OpenAI to dynamic AI-generated content using Google Gemini.

## Overview

CodeClash has been upgraded with AI-powered features:
- ✅ **Dynamic Problem Generation**: Gemini AI generates personalized coding challenges
- ✅ **AI-Generated Editorials**: Post-match analysis and learning insights
- ✅ **Gemini Integration**: Replaced OpenAI with Google Gemini AI
- ✅ **Langfuse Observability**: Track and monitor AI performance

## Changes Made

### 1. Backend Changes

#### New Files
- `backend/services/geminiService.js` - Core AI service
- `backend/.env.example` - Environment configuration template

#### Modified Files
- `backend/package.json` - Added `@google/generative-ai` dependency
- `backend/controllers/problemController.js` - Updated to use AI generation
- `backend/socket/battleSocket.js` - Integrated AI for battles and editorials

#### Deleted Files
- `backend/scripts/seedProblems.js` - No longer needed (AI generates problems)

### 2. Compilerd Changes

#### New Files
- `compilerd/helpers/geminiInstance.js` - Gemini AI helper with Langfuse
- `compilerd/.env.example` - Environment configuration template

#### Modified Files
- `compilerd/package.json` - Removed OpenAI, added Gemini
- `compilerd/configs/app.config.js` - Updated to use Gemini config
- `compilerd/server.js` - Import from geminiInstance instead of openaiInstance
- `compilerd/services/code.service.js` - Updated imports

### 3. Configuration Changes

#### Environment Variables

**Before (OpenAI)**:
```env
OPENAI_API_KEY=sk-...
SUBJECTIVE_OPENAI_MODEL=gpt-4
```

**After (Gemini)**:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Langfuse configuration remains the same:
```env
LANGFUSE_PUBLIC_KEY=your_public_key
LANGFUSE_SECRET_KEY=your_secret_key
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

## Setup Instructions

### 1. Install Dependencies

**Backend**:
```bash
cd backend
npm install
```

**Compilerd**:
```bash
cd compilerd
npm install
```

### 2. Configure Environment Variables

**Backend** (`backend/.env`):
```env
# Copy from .env.example
GEMINI_API_KEY=AIzaSyCugupfo_gaymzLN_YwrcsGLiYo3RS4vVg
MONGO_URI=mongodb://localhost:27017/codeclash
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
PORT=5000
```

**Compilerd** (`compilerd/.env`):
```env
# Copy from .env.example
GEMINI_API_KEY=AIzaSyCugupfo_gaymzLN_YwrcsGLiYo3RS4vVg
LANGFUSE_PUBLIC_KEY=your_langfuse_public_key
LANGFUSE_SECRET_KEY=your_langfuse_secret_key
LANGFUSE_BASE_URL=https://cloud.langfuse.com
PORT=3000
```

### 3. Database Cleanup (Optional)

If you want to remove old seed problems:
```javascript
// In MongoDB shell or Compass
db.problems.deleteMany({})
```

New problems will be generated dynamically by AI.

### 4. Start Services

**Backend**:
```bash
cd backend
npm run dev
```

**Compilerd**:
```bash
cd compilerd
npm start
```

## API Key Setup

### Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add to `.env` files

### Get Langfuse Keys (Optional but Recommended)

1. Visit [Langfuse Cloud](https://cloud.langfuse.com)
2. Create an account or sign in
3. Create a new project
4. Copy Public Key and Secret Key from Settings
5. Add to `compilerd/.env`

## Migration Checklist

- [ ] Install new dependencies (`npm install`)
- [ ] Get Gemini API key
- [ ] Configure `.env` files for both backend and compilerd
- [ ] Remove OpenAI API keys if present
- [ ] Test problem generation (start a practice battle)
- [ ] Test editorial generation (complete a battle)
- [ ] Verify Langfuse tracking (check dashboard if configured)
- [ ] Update deployment environment variables

## Testing

### Test Problem Generation

1. Start backend server
2. Login to the app
3. Start a practice battle or join queue
4. A unique AI-generated problem should appear

### Test Editorial

1. Complete a battle (solve all test cases)
2. Check the post-match screen
3. You should see an AI-generated editorial with:
   - Problem summary
   - Optimal approach
   - Example solution
   - Complexity analysis
   - Key takeaways
   - Common mistakes

## Troubleshooting

### Problem: "Failed to generate problem"

**Solution**: 
- Check GEMINI_API_KEY is set correctly
- Verify API key is active in Google AI Studio
- Check internet connection
- Review backend logs for detailed error

### Problem: "Editorial not showing"

**Solution**:
- Check if battle completed successfully
- Verify Gemini API key
- Check browser console for errors
- Review backend socket logs

### Problem: "Langfuse not tracking"

**Solution**:
- Verify LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY
- Check LANGFUSE_BASE_URL is correct
- Ensure compilerd is using geminiInstance.js
- Check Langfuse dashboard for project status

## Performance Considerations

### AI Generation Time
- Problem generation: ~2-5 seconds
- Editorial generation: ~3-7 seconds
- Async processing doesn't block battles

### Caching
- Generated problems are saved to database
- Problems can be reused across different users
- Editorials are saved with problems

### Cost Management
- Gemini 1.5 Flash is cost-effective
- Monitor usage through Langfuse
- Set up usage alerts in Google Cloud Console

## Rollback Plan

If you need to rollback to static problems:

1. Restore `seedProblems.js` from git history
2. Run: `npm run seed`
3. Update `problemController.js` to use database queries
4. Update `battleSocket.js` to remove AI editorial generation

## Support

For issues or questions:
- Check `AI_FEATURES.md` for feature documentation
- Review backend/compilerd logs for errors
- Test with `.env.example` as reference

## Next Steps

After successful migration:
1. Monitor AI-generated content quality
2. Collect user feedback on problems and editorials
3. Adjust prompts if needed in `geminiService.js`
4. Consider implementing additional AI features (hints, code review)
5. Set up cost alerts for Gemini API usage

---

**Migration completed successfully!** 🎉
