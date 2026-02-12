import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the current directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the backend directory FIRST before any other imports
const envPath = join(__dirname, '.env');
console.log('📁 Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('❌ Error loading .env:', result.error);
} else {
  console.log('✅ .env loaded successfully');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
  console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
  console.log('   GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Set' : 'Not set');
}

// Now import other modules AFTER env is loaded
import { connectDB } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import problemRoutes from './routes/problemRoutes.js';
import battleRoutes from './routes/battleRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import userRoutes from './routes/userRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import { setupBattleSocket } from './socket/battleSocket.js';

const app = express();

import { createProxyMiddleware } from 'http-proxy-middleware';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes - Must come BEFORE proxies
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/contact', contactRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'CodeClash API is running' });
});

// Compiler service proxy
app.use(
  '/compiler',
  createProxyMiddleware({
    target: 'https://codeclash-czhz.onrender.com',
    changeOrigin: true
  })
);

// React frontend proxy - Must come LAST as catch-all

// Serve frontend index.html for unknown routes (SPA fallback)
import { existsSync } from 'fs';
const frontendPath = join(__dirname, '../frontend');
const indexHtmlPath = join(frontendPath, 'index.html');

if (existsSync(indexHtmlPath)) {
  app.use('*', (req, res) => {
    res.sendFile(indexHtmlPath);
  });
} else {
  // If index.html doesn't exist locally, fallback to proxy
  app.use(
    '/',
    createProxyMiddleware({
      target: 'https://gocodeclash.vercel.app/',
      changeOrigin: true,
      ws: true
    })
  );
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Setup Socket.IO
setupBattleSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server ready for real-time battles`);
});
