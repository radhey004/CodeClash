import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  code: String,
  language: String,
  submittedAt: Date,
  executionTime: Number,
  passed: Boolean,
  testCasesPassed: Number,
  totalTestCases: Number,
  scores: {
    correctness: {
      type: Number,
      default: 0
    },
    quality: {
      type: Number,
      default: 0
    },
    speed: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  qualityAnalysis: {
    readability: Number,
    efficiency: Number,
    bestPractices: Number,
    rating: String
  }
});

const testCaseSchema = new mongoose.Schema({
  input: String,
  output: String,
  isHidden: {
    type: Boolean,
    default: false
  }
});

const editorialSchema = new mongoose.Schema({
  summary: String,
  approach: String,
  optimalSolution: String,
  timeComplexity: String,
  spaceComplexity: String,
  keyTakeaways: [{
    type: String
  }],
  commonMistakes: [{
    type: String
  }]
});

const problemDataSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard']
  },
  constraints: [String],
  testCases: [testCaseSchema],
  timeLimit: {
    type: Number,
    default: 1800
  },
  xpReward: {
    type: Number,
    default: 50
  },
  editorial: editorialSchema
});

const battleSchema = new mongoose.Schema({
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  problem: {
    type: problemDataSchema,
    required: true
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  submissions: [submissionSchema],
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed'],
    default: 'active'
  },
  isFriendBattle: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    enum: ['practice', 'ranked'],
    default: 'ranked'
  },
  solved: {
    type: Boolean,
    default: false
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
}, {
  timestamps: true
});

export default mongoose.model('Battle', battleSchema);
