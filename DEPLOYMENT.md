# 🚀 CodeClash Deployment Guide

## Complete Production Deployment & Configuration

This guide covers everything from local setup to production deployment across multiple platforms.

---

## 📋 Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Production Build](#production-build)
5. [Deployment Options](#deployment-options)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Performance Optimization](#performance-optimization)

---

## Local Development Setup

### System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4 GB
- Storage: 5 GB free space
- OS: Windows 10/11, macOS 10.15+, Ubuntu 20.04+

**Recommended:**
- CPU: 4+ cores
- RAM: 8 GB+
- Storage: 10 GB+ SSD
- OS: Latest stable versions

### Required Software

### Required Software

| Software | Version | Download Link |
|----------|---------|---------------|
| Node.js | v18+ | https://nodejs.org |
| MongoDB | v6+ | https://mongodb.com/try/download/community |
| Git | Latest | https://git-scm.com |
| GCC/G++ | Latest | MinGW (Windows) / native (Linux/Mac) |
| Python | 3.8+ | https://python.org |
| Java JDK | 11+ | https://adoptium.net |

### Installation Steps

**1. Clone Repository:**
```bash
git clone <repository-url> codeclash
cd codeclash
```

**2. Install Dependencies:**
```bash
# Frontend
npm install

# Backend
cd backend
npm install

# Compiler  
cd "../code compiler/compilerd"
npm install
cd ../..
```

**3. Verify Installation:**
```bash
node --version  # Should be v18+
npm --version   # Should be 9+
mongosh         # Should connect to MongoDB
```

---

## Environment Configuration

### Frontend Environment

Create `.env` in **root directory**:

```env
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000

# Environment
VITE_NODE_ENV=development
```

### Backend Environment

Create `.env` in **root directory** (same file as above):

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/codeclash

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRE=7d

# Services
COMPILER_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Optional: Email (for future features)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Compiler Service Environment

Create `.env` in **code compiler/compilerd**:

```env
# Compiler Config
PORT=3000
NODE_ENV=development

# Resource Limits
ALLOWED_RAM=512
MEMORY_USED_THRESHOLD=512
TIMEOUT=5000

# Temp Directory
TEMP_DIR=./temp
```

### Security Best Practices

**JWT_SECRET Generation:**
```bash
# Generate secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Environment Variables:**
- ✅ Never commit `.env` files to Git
- ✅ Use strong, unique secrets in production
- ✅ Rotate secrets periodically
- ✅ Use environment-specific configs

---

## Database Setup

### Option 1: Local MongoDB

**Windows:**
```powershell
# Start MongoDB service
net start MongoDB

# Verify
mongosh
```

**Linux:**
```bash
# Start MongoDB
sudo systemctl start mongod

# Enable on boot
sudo systemctl enable mongod

# Verify
mongosh
```

**macOS:**
```bash
# Start MongoDB
brew services start mongodb-community

# Verify
mongosh
```

### Option 2: MongoDB Atlas (Cloud)

1. **Create Account:** https://www.mongodb.com/cloud/atlas/register

2. **Create Cluster:**
   - Choose FREE tier
   - Select region closest to you
   - Click "Create Cluster"

3. **Get Connection String:**
   - Click "Connect"
   - Choose "Connect your application"
   - Copy connection string

4. **Update .env:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codeclash?retryWrites=true&w=majority
```

5. **Whitelist IP:**
   - Database Access → Network Access
   - Add IP Address
   - Choose "Allow Access from Anywhere" (0.0.0.0/0)

### Seed Database with Problems

```bash
# From root directory
npm run seed

# Or manually
cd backend
node scripts/seedProblems.js
```

**Expected Output:**
```
✓ Connected to MongoDB
✓ Seeding problems...
✓ Two Sum (Easy) - 50 XP
✓ Reverse String (Easy) - 40 XP
✓ Valid Parentheses (Medium) - 75 XP
✓ Database seeded successfully!
```

---

## Production Build

### Frontend Build

```bash
# Build for production
npm run build

# Output: dist/ folder
# Contains optimized HTML, CSS, JS files
```

**Build Configuration** (`vite.config.ts`):
```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable in production
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          socket: ['socket.io-client'],
          editor: ['@monaco-editor/react']
        }
      }
    }
  }
})
```

### Backend Preparation

**Production Mode:**
- Set `NODE_ENV=production` in .env
- Use process managers (PM2)
- Enable logging
- Configure error handling

---

## Deployment Options

### Option 1: Single Server (VPS)

**Recommended Providers:**
- DigitalOcean ($6/month droplet)
- AWS EC2 (t2.micro free tier)
- Linode ($5/month)
- Vultr ($6/month)

**Setup Steps:**

**1. Connect to Server:**
```bash
ssh root@your-server-ip
```

**2. Install Dependencies:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Install compilers
sudo apt install -y gcc g++ python3 default-jdk

# Install PM2
sudo npm install -g pm2
```

**3. Clone & Configure:**
```bash
# Clone repository
git clone <your-repo> /var/www/codeclash
cd /var/www/codeclash

# Install dependencies
npm install
cd backend && npm install
cd "../code compiler/compilerd" && npm install
cd /var/www/codeclash

# Create .env files
nano .env  # Add production config
```

**4. Start Services with PM2:**
```bash
# Start compiler
cd "code compiler/compilerd"
pm2 start npm --name compiler -- start

# Start backend
cd ../../backend
pm2 start npm --name backend -- start

# Save PM2 config
pm2 save
pm2 startup

# Monitor
pm2 monit
```

**5. Setup Nginx Reverse Proxy:**
```bash
# Install nginx
sudo apt install nginx

# Create config
sudo nano /etc/nginx/sites-available/codeclash
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/codeclash/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/codeclash /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**6. SSL with Let's Encrypt:**
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renew
sudo certbot renew --dry-run
```

### Option 2: Docker Deployment

**Create `docker-compose.yml`:**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: codeclash

  compiler:
    build:
      context: ./code compiler/compilerd
      dockerfile: Dockerfile
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always    
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
      - compiler
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/codeclash
      - COMPILER_URL=http://compiler:3000
      - JWT_SECRET=${JWT_SECRET}

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

**Deploy:**
```bash
docker-compose up -d
```

### Option 3: Cloud Platform (Vercel + Heroku)

**Frontend on Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Backend on Heroku:**
```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create codeclash-api

# Add MongoDB
heroku addons:create mongolab

# Deploy
git subtree push --prefix backend heroku main
```

---

## Monitoring & Maintenance

### PM2 Process Management

```bash
# View all processes
pm2 list

# Monitor in real-time
pm2 monit

# View logs
pm2 logs backend
pm2 logs compiler

# Restart services
pm2 restart all
pm2 restart backend

# Stop services  
pm2 stop all

# Delete services
pm2 delete all
```

### Logging

**Configure Winston (backend):**
```javascript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

module.exports = logger;
```

### Database Backups

```bash
# Backup MongoDB
mongodump --db codeclash --out /backups/$(date +%Y%m%d)

# Restore
mongorestore /backups/20260208/codeclash
```

**Automated Daily Backups:**
```bash
# Add to crontab
crontab -e

# Add this line (backup at 2 AM daily)
0 2 * * * mongodump --db codeclash --out /backups/$(date +\%Y\%m\%d)
```

---

## Troubleshooting

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| MongoDB connection refused | MongoDB not running | Start MongoDB: `sudo systemctl start mongod` |
| Port already in use | Previous process still running | Kill process: `lsof -i :5000` then `kill -9 <PID>` |
| Compiler timeout | Code running too long | Check compiler timeout settings |
| WebSocket disconnect | Backend restart | Implement reconnection logic |
| Build fails | Missing dependencies | Run `npm install` in all directories |
| 404 on refresh | Missing server config | Configure nginx `try_files` |
| CORS errors | Wrong origin URL | Update FRONTEND_URL in .env |

### Debug Commands

```bash
# Check service status
pm2 status

# View real-time logs
pm2 logs --lines 100

# Check MongoDB status
sudo systemctl status mongod

# Test backend API
curl http://localhost:5000/api/health

# Test compiler service
curl http://localhost:3000/health

# Check nginx config
sudo nginx -t

# View nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## Performance Optimization

### Frontend Optimization

**Code Splitting:**
```typescript
// Lazy load routes
const Arena = lazy(() => import('./pages/Arena'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

**Bundle Analysis:**
```bash
npm run build -- --report
```

### Backend Optimization

**Database Indexing:**
```javascript
// User schema
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ xp: -1, level: -1 }); // Leaderboard
```

**Query Optimization:**
```javascript
// Only select needed fields
User.find().select('username level xp').limit(100);
```

---

## Security Best Practices

### Pre-Deployment Checklist

- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Add rate limiting
- [ ] Sanitize user inputs
- [ ] Enable MongoDB auth
- [ ] Remove debug logs

### Security Headers

```javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', limiter);
```

---

## Final Deployment Checklist

### Before Going Live

- [ ] All environment variables set
- [ ] Database seeded
- [ ] SSL certificate installed  
- [ ] Domain configured
- [ ] PM2 configured for auto-restart
- [ ] Nginx configured
- [ ] Firewall rules set
- [ ] Backups automated
- [ ] Monitoring enabled
- [ ] Security headers added
- [ ] Error logging configured
- [ ] Health checks working
- [ ] Documentation updated

---

## Additional Resources

### Documentation Links

- 📖 [README.md](./README.md) - Project overview
- ⚡ [QUICK_START.md](./QUICK_START.md) - Quick setup guide  
- 🏗️ [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture

### External Resources

- [React Documentation](https://react.dev)
- [Express.js Documentation](https://expressjs.com)
- [Socket.IO Documentation](https://socket.io/docs)
- [MongoDB Documentation](https://docs.mongodb.com)
- [PM2 Documentation](https://pm2.keymetrics.io/docs)
- [Nginx Documentation](https://nginx.org/en/docs)

---

<div align="center">

**🎉 Your CodeClash platform is ready for deployment! 🎉**

For questions or support, open an issue on GitHub.

[⬆ Back to Top](#-codeclash-deployment-guide)

</div>
