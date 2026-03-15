# 🏗️ CodeClash Architecture

## System Design & Technical Documentation

This document provides a comprehensive overview of CodeClash's architecture, data flow, and technical implementation.

---

## 📐 Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Technology Stack](#technology-stack)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [Database Schema](#database-schema)
5. [WebSocket Events](#websocket-events)
6. [API Endpoints](#api-endpoints)
7. [Security](#security)
8. [Performance](#performance)

---

## High-Level Architecture

### System Overview

### System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│   │  Browser   │  │  Browser   │  │  Browser   │           │
│   │  Player 1  │  │  Player 2  │  │  Player N  │           │
│   └─────┬──────┘  └─────┬──────┘  └─────┬──────┘           │
│         │                │                │                   │
│    React + TypeScript + Socket.IO Client                    │
│         │                │                │                   │
└─────────┼────────────────┼────────────────┼───────────────────┘
          │                │                │
          │         WebSocket (Socket.IO)   │
          │                │                │
┌─────────▼────────────────▼────────────────▼───────────────────┐
│                       APPLICATION LAYER                        │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐      │
│  │          Express.js + Socket.IO Server             │      │
│  ├────────────────────────────────────────────────────┤      │
│  │                                                    │      │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │      │
│  │  │   Auth   │  │  Battle  │  │  Matchmaking │    │      │
│  │  │Controller│  │Controller│  │   Service    │    │      │
│  │  └──────────┘  └──────────┘  └──────────────┘    │      │
│  │                                                    │      │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │      │
│  │  │  Socket  │  │   Code   │  │  Leaderboard │    │      │
│  │  │ Handlers │  │ Executor │  │   Service    │    │      │
│  │  └──────────┘  └──────────┘  └──────────────┘    │      │
│  │                                                    │      │
│  └────────────────────────────────────────────────────┘      │
│                          Port 5000                            │
└───────────────────────┬───────────────────────────────────────┘
                        │
                   HTTP Requests
                        │
┌───────────────────────▼───────────────────────────────────────┐
│                    COMPILER SERVICE LAYER                      │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐      │
│  │         Code Execution Service (Node.js)           │      │
│  ├────────────────────────────────────────────────────┤      │
│  │                                                    │      │
│  │  ┌─────┐  ┌─────┐  ┌──────┐  ┌────┐  ┌──────┐  │      │
│  │  │ C++ │  │  C  │  │ Java │  │ JS │  │Python│  │      │
│  │  └─────┘  └─────┘  └──────┘  └────┘  └──────┘  │      │
│  │                                                    │      │
│  │  - Sandboxed Execution                            │      │
│  │  - Memory & Time Limits                           │      │
│  │  - Test Case Validation                           │      │
│  │                                                    │      │
│  └────────────────────────────────────────────────────┘      │
│                          Port 3000                            │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                           │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│                   ┌──────────────────┐                        │
│                   │     MongoDB      │                        │
│                   ├──────────────────┤                        │
│                   │                  │                        │
│                   │  ┌────────────┐  │                        │
│                   │  │   Users    │  │                        │
│                   │  └────────────┘  │                        │
│                   │  ┌────────────┐  │                        │
│                   │  │  Battles   │  │                        │
│                   │  └────────────┘  │                        │
│                   │  ┌────────────┐  │                        │
│                   │  │  Problems  │  │                        │
│                   │  └────────────┘  │                        │
│                   │  ┌────────────┐  │                        │
│                   │  │  Friends   │  │                        │
│                   │  └────────────┘  │                        │
│                   │                  │                        │
│                   └──────────────────┘                        │
│                    Port 27017                                 │
└───────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.5 | Type safety |
| Vite | 5.x | Build tool |
| Tailwind CSS | 3.x | Styling |
| Socket.IO Client | 4.x | Real-time communication |
| Monaco Editor | Latest | Code editor |
| React Router | 6.x | Navigation |
| Axios | 1.x | HTTP client |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 4.x | Web framework |
| Socket.IO | 4.x | WebSocket server |
| MongoDB | 6.x | Database |
| Mongoose | 8.x | ODM |
| JWT | 9.x | Authentication |
| bcryptjs | 2.x | Password hashing |
| CORS | 2.x | Cross-origin support |

### Compiler Service

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Child Process | Code execution isolation |
| FS Module | File system operations |
| GCC/G++ | C/C++ compilation |
| JDK | Java compilation |
| Python | Python execution |

---

## Data Flow Diagrams

### 1. User Authentication Flow

### 1. User Authentication Flow

```
  Client                     Backend                  Database
    │                          │                         │
    │─── POST /api/auth/login ─>│                         │
    │    { email, password }   │                         │
    │                          │                         │
    │                          │─── Find User ───────────>│
    │                          │    by email             │
    │                          │<─── User document ───────│
    │                          │                         │
    │                          │     [Compare Password]  │
    │                          │     bcrypt.compare()    │
    │                          │                         │
    │                          │     [Generate JWT]      │
    │                          │     jwt.sign()          │
    │                          │                         │
    │<─ 200 OK + { token } ────│                         │
    │                          │                         │
    │  [Store token in         │                         │
    │   localStorage]          │                         │
    │                          │                         │
```

### 2. Matchmaking Flow

```
Player 1                Server                  Player 2
   │                      │                        │
   │──join-queue(easy)───>│                        │
   │                      │                        │
   │                  [Add to Queue]               │
   │                  easy: [P1]                   │
   │                      │                        │
   │<──queue-status(1)────│                        │
   │                      │                        │
   │   [Waiting...]       │<──join-queue(easy)─────│
   │                      │                        │
   │                  [Add to Queue]               │
   │                  easy: [P1, P2]               │
   │                      │                        │
   │                      │──queue-status(2)──────>│
   │                      │                        │
   │              [Matchmaking Logic]              │
   │                     ├─ Check queue size       │
   │                     ├─ Match P1 & P2          │
   │                     ├─ Create battle          │
   │                     ├─ Select problem         │
   │                     └─ Remove from queue      │
   │                      │                        │
   │<──match-found────────┤──match-found──────────>│
   │  {battleId,opponent} │  {battleId,opponent}   │
   │                      │                        │
   │  [Navigate to        │       [Navigate to     │
   │   /arena/:id]        │        /arena/:id]     │
   │                      │                        │
```

### 3. Battle Flow (Code Submission)

### 3. Battle Flow (Code Submission)

```
Player              Backend             Compiler          Database
  │                    │                    │                │
  │─submit-code───────>│                    │                │
  │ {code,lang}        │                    │                │
  │                    │                    │                │
  │              [Validation]              │                │
  │                    │                    │                │
  │                    │─POST /execute─────>│                │
  │                    │ {code,lang,tests}  │                │
  │                    │                    │                │
  │                    │             [Create temp file]      │
  │                    │             [Compile if needed]     │
  │                    │             [Run test cases]        │
  │                    │             [Monitor time/memory]   │
  │                    │                    │                │
  │                    │<─Results───────────│                │
  │                    │ {passed,output}    │                │
  │                    │                    │                │
  │                    │─Update battle──────────────────────>│
  │                    │ Add submission                      │
  │                    │ Check winner                        │
  │                    │<─Battle updated─────────────────────│
  │                    │                    │                │
  │<─submission-result─│                    │                │
  │ {passed,isWinner}  │                    │                │
  │                    │                    │                │
  │              [If winner]               │                │
  │                    │                    │                │
  │<─battle-complete───│                    │                │
  │ {winner,xpEarned}  │                    │                │
  │                    │                    │                │
```

### 4. Code Execution Pipeline

```
┌─────────────────────────────────────────────────────────┐
│              Code Execution Pipeline                     │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────┐
            │  Receive Code     │
            │  + Language       │
            │  + Test Cases     │
            └─────────┬─────────┘
                      │
                      ▼
            ┌───────────────────┐
            │  Validate Input   │
            │  - Check language │
            │  - Syntax check   │
            └─────────┬─────────┘
                      │
                      ▼
            ┌───────────────────┐
            │  Create Temp File │
            │  ./temp/user_{id} │
            └─────────┬─────────┘
                      │
                      ▼
        ┌─────────────┴─────────────┐
        │  Compile? (C/C++/Java)    │
        └────┬──────────────┬───────┘
          NO │              │ YES
             │              ▼
             │    ┌──────────────────┐
             │    │  Compile Code    │
             │    │  gcc/javac       │
             │    └────────┬─────────┘
             │             │
             │             ▼
             │    ┌──────────────────┐
             │    │  Check Errors    │
             │    └────────┬─────────┘
             │             │
             └─────────────┤
                           ▼
              ┌────────────────────┐
              │  For Each Test     │
              │  Case              │
              └─────────┬──────────┘
                        │
                        ▼
              ┌────────────────────┐
              │  Execute          │
              │  - Provide input  │
              │  - Capture output │
              │  - Track time     │
              │  - Monitor memory │
              └─────────┬──────────┘
                        │
                        ▼
              ┌────────────────────┐
              │  Compare Output   │
              │  with Expected    │
              └─────────┬──────────┘
                        │
                        ▼
              ┌────────────────────┐
              │  Collect Results  │
              │  - Passed count   │
              │  - Failed count   │
              │  - Execution time │
              └─────────┬──────────┘
                        │
                        ▼
              ┌────────────────────┐
              │  Cleanup          │
              │  - Delete temp    │
              │  - Free resources │
              └─────────┬──────────┘
                        │
                        ▼
              ┌────────────────────┐
              │  Return Results   │
              └────────────────────┘
```

---

## Database Schema

### Users Collection

### Users Collection

```javascript
{
  _id: ObjectId("..."),
  username: String (unique, required, 3-20 chars),
  email: String (unique, required, validated),
  password: String (hashed with bcrypt),
  level: Number (default: 1, max: 50),
  xp: Number (default: 0),
  wins: Number (default: 0),
  losses: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- email: unique
- username: unique
- level: descending (for leaderboard)
- xp: descending (for leaderboard)
```

### Battles Collection

```javascript
{
  _id: ObjectId("..."),
  players: [
    ObjectId("userId1"),
    ObjectId("userId2")
  ],
  problemId: ObjectId("problemId"),
  winner: ObjectId("userId") || null,
  submissions: [
    {
      userId: ObjectId,
      code: String,
      language: String ("python"|"java"|"cpp"|"c"|"javascript"),
      submittedAt: Date,
      passed: Boolean,
      testCasesPassed: Number,
      totalTestCases: Number,
      executionTime: Number (milliseconds)
    }
  ],
  status: String ("waiting"|"active"|"completed"),
  difficulty: String ("easy"|"medium"|"hard"),
  startedAt: Date,
  completedAt: Date || null,
  createdAt: Date
}

// Indexes
- players: compound index
- winner: for win/loss queries
- status: for active battles
- createdAt: descending (for recent battles)
```

### Problems Collection

```javascript
{
  _id: ObjectId("..."),
  title: String (required),
  description: String (required, markdown),
  difficulty: String ("easy"|"medium"|"hard"),
  testCases: [
    {
      input: String,
      expectedOutput: String,
      isHidden: Boolean (default: false)
    }
  ],
  starterTemplates: {
    python: String,
    java: String,
    cpp: String,
    c: String,
    javascript: String
  },
  xpReward: Number,
  constraints: {
    timeLimit: Number (seconds),
    memoryLimit: Number (MB)
  },
  tags: [String],
  createdAt: Date
}

// Indexes
- difficulty: for filtering
- tags: for search
```

### Friends Collection

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId (ref: User),
  friendId: ObjectId (ref: User),
  status: String ("pending"|"accepted"),
  createdAt: Date
}

// Indexes
- userId + friendId: compound unique
- userId: for user's friends list
- status: for pending requests
```

---

## WebSocket Events

### Client → Server Events

```javascript
// Matchmaking
'join-queue': { userId, difficulty }
'leave-queue': { userId }

// Battle Room
'join-battle': { battleId, userId }
'leave-battle': { battleId, userId }
'submit-code': { battleId, userId, code, language }
'code-update': { battleId, code }
'ready': { battleId, userId }

// Connection
'disconnect': { socketId }
```

### Server → Client Events

```javascript
// Matchmaking
'queue-status': { queueSize, position }
'match-found': { battleId, opponent: { userId, username, level } }
'queue-left': { success: true }

// Battle Updates
'battle-joined': { battle, players }
'opponent-typing': { codeLength, language }
'opponent-submitted': { testCasesPassed, totalTestCases }
'submission-result': { passed, testCasesPassed, isWinner, xpEarned }
'battle-complete': { winner, loser, xpEarned }
'opponent-left': { reason }

// Errors
'error': { message, code }
```

---

## API Endpoints

### Authentication Routes (`/api/auth`)

```
POST   /api/auth/register
Body:  { username, email, password }
Response: { token, user }

POST   /api/auth/login  
Body:  { email, password }
Response: { token, user }

GET    /api/auth/me [Protected]
Headers: { Authorization: "Bearer {token}" }
Response: { user }
```

### Battle Routes (`/api/battles`)

```
POST   /api/battles [Protected]
Body:  { difficulty }
Response: { battle }

GET    /api/battles/:id [Protected]
Response: { battle, problem }

POST   /api/battles/:id/submit [Protected]
Body:  { code, language }
Response: { result, isWinner, xpEarned }

GET    /api/battles/recent [Protected]
Response: { battles[] }
```

### Problem Routes (`/api/problems`)

```
GET    /api/problems
Query: ?difficulty=easy
Response: { problems[] }

GET    /api/problems/:id
Response: { problem }
```

### User Routes (`/api/users`)

```
GET    /api/users/:id [Protected]
Response: { user, stats }

GET    /api/users/:id/battles [Protected]
Response: { battles[], wins, losses }

PUT    /api/users/profile [Protected]
Body:  { username, email }
Response: { user }
```

### Leaderboard Routes (`/api/leaderboard`)

```
GET    /api/leaderboard
Query: ?limit=100&page=1
Response: { users[], total }

GET    /api/leaderboard/top
Response: { top10Users[] }
```

### Friend Routes (`/api/friends`)

```
POST   /api/friends/add [Protected]
Body:  { friendId }
Response: { friendship }

GET    /api/friends [Protected]
Response: { friends[] }

DELETE /api/friends/:friendId [Protected]
Response: { success: true }
```

---

## Security

### Authentication & Authorization

**JWT Token Structure:**
```javascript
{
  userId: ObjectId,
  email: String,
  iat: Number (issued at),
  exp: Number (expiration)
}
```

**Middleware:**
```javascript
// auth.js
- Verify JWT token
- Attach user to request
- Handle expired tokens
```

### Password Security

- **Hashing:** bcrypt with salt rounds = 10
- **Validation:** Min 8 characters, required
- **Storage:** Never store plain text

### Input Validation

- **User Input:** Sanitized and validated
- **Code Submissions:** Length limits, language validation
- **Battle Integrity:** Verify user is in battle

### Rate Limiting

```javascript
// Recommended limits
- Login attempts: 5 per 15 minutes
- Code submissions: 10 per minute
- API calls: 100 per minute per user
```

---

## Performance

### Optimization Strategies

**1. Database Indexing:**
- Email/username for fast lookups
- Battle status for active battles
- Level/XP for leaderboard

**2. WebSocket Rooms:**
- Isolated communication per battle
- Reduced broadcast overhead

**3. Caching:**  
- Leaderboard cached every 5 minutes
- Problems cached on server startup
- User sessions in memory

**4. Code Execution:**
- Timeout limits (5 seconds)
- Memory limits (512 MB)
- Process isolation

**5. Database Queries:**
- Pagination for leaderboards
- Limited populated fields
- Select only needed fields

### Scalability Considerations

**Horizontal Scaling:**
```
- Load balancer (nginx)
- Multiple backend instances  
- Redis for Socket.IO adapter
- MongoDB replica set
```

**Service Separation:**
```
- Authentication service
- Battle service
- Compiler service
- Each can scale independently
```

---

## Deployment Architecture

```
                    [Internet]
                        │
                        ▼
                  [Load Balancer]
                   (nginx/AWS)
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
   [Backend 1]     [Backend 2]     [Backend N]
        │               │               │
        └───────────────┼───────────────┘
                        │
           ┌────────────┼────────────┐
           │            │            │
           ▼            ▼            ▼
      [MongoDB]    [Redis]    [Compiler]
     (Replica Set)  (Cache)    (Service)
```

---

## Summary

CodeClash's architecture is designed for:

✅ **Real-time Performance** - WebSocket for instant updates  
✅ **Scalability** - Microservices can scale independently  
✅ **Security** - JWT auth, bcrypt passwords, input validation  
✅ **Reliability** - Error handling, timeout limits, process isolation  
✅ **Maintainability** - Clear separation of concerns, modular design

---

<div align="center">

**For deployment details, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

[⬆ Back to Top](#-codeclash-architecture)

</div>
