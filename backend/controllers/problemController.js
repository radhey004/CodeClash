import { generateProblem } from '../services/geminiService.js';
import Battle from '../models/Battle.js';

// Get all past problems from completed battles
export const getProblems = async (req, res) => {
  try {
    const battles = await Battle.find({ status: 'completed' })
      .select('problem')
      .limit(100)
      .sort({ createdAt: -1 });
    
    const problems = battles.map(b => ({
      ...b.problem.toObject(),
      testCases: b.problem.testCases.map(tc => ({
        input: tc.input,
        isHidden: tc.isHidden
      }))
    }));
    
    res.json(problems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific problem from a battle
export const getProblem = async (req, res) => {
  try {
    const battle = await Battle.findById(req.params.id);

    if (!battle || !battle.problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const problemData = battle.problem.toObject();
    problemData.testCases = problemData.testCases.map(tc => ({
      input: tc.input,
      isHidden: tc.isHidden
    }));

    res.json(problemData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate AI problem based on user profile (without saving to DB)
export const getRandomProblem = async (req, res) => {
  try {
    const userId = req.user?._id;
    
    // Get user profile if authenticated
    let userProfile = {
      league: 'Unranked',
      level: 1,
      xp: 0
    };
    
    if (userId) {
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(userId);
      if (user) {
        userProfile = {
          league: user.league,
          level: user.level,
          xp: user.xp
        };
      }
    }
    
    // Generate problem using Gemini AI (not saved to DB)
    const problemData = await generateProblem(userProfile);
    
    // Return problem without test outputs
    const responseData = {
      ...problemData,
      testCases: problemData.testCases.map(tc => ({
        input: tc.input,
        isHidden: tc.isHidden
      }))
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error generating random problem:', error);
    res.status(500).json({ message: error.message });
  }
};
