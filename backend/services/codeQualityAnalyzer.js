/**
 * Code Quality Analyzer Service
 * Analyzes submitted code for quality metrics including:
 * - Code complexity
 * - Code style and readability
 * - Best practices adherence
 * - Time and space complexity estimation
 */

/**
 * Analyzes code quality and returns a score from 0-100
 * @param {string} code - The submitted code
 * @param {string} language - Programming language used
 * @param {Array} testResults - Results from test case execution
 * @returns {Object} Quality analysis results with score and breakdown
 */
export const analyzeCodeQuality = (code, language, testResults) => {
  const metrics = {
    readability: 0,
    efficiency: 0,
    bestPractices: 0,
    overall: 0
  };

  // 1. Readability Analysis (0-40 points)
  metrics.readability = analyzeReadability(code, language);

  // 2. Efficiency Analysis (0-30 points) - based on execution time
  metrics.efficiency = analyzeEfficiency(testResults);

  // 3. Best Practices (0-30 points)
  metrics.bestPractices = analyzeBestPractices(code, language);

  // Calculate overall score
  metrics.overall = Math.round(metrics.readability + metrics.efficiency + metrics.bestPractices);

  return {
    score: metrics.overall,
    breakdown: {
      readability: Math.round(metrics.readability),
      efficiency: Math.round(metrics.efficiency),
      bestPractices: Math.round(metrics.bestPractices)
    },
    rating: getQualityRating(metrics.overall)
  };
};

/**
 * Analyze code readability
 */
const analyzeReadability = (code, language) => {
  let score = 40; // Start with perfect score
  const lines = code.split('\n');

  // Check for reasonable line length
  const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
  if (avgLineLength > 100) score -= 5;
  if (avgLineLength > 150) score -= 5;

  // Check for comments (good practice)
  const commentPatterns = {
    c: /\/\*[\s\S]*?\*\/|\/\/.*/g,
    cpp: /\/\*[\s\S]*?\*\/|\/\/.*/g,
    java: /\/\*[\s\S]*?\*\/|\/\/.*/g,
    javascript: /\/\*[\s\S]*?\*\/|\/\/.*/g,
    python: /#.*|"""[\s\S]*?"""/g
  };

  const pattern = commentPatterns[language.toLowerCase()] || /\/\*[\s\S]*?\*\/|\/\/.*/g;
  const hasComments = pattern.test(code);
  if (!hasComments && lines.length > 20) score -= 5;

  // Check for excessive nesting
  const maxIndentation = Math.max(...lines.map(line => {
    const match = line.match(/^[\s\t]*/);
    return match ? match[0].length : 0;
  }));
  if (maxIndentation > 20) score -= 5;
  if (maxIndentation > 30) score -= 5;

  // Check for meaningful variable naming (not just single letters everywhere)
  const singleLetterVars = code.match(/\b[a-z]\s*=/gi) || [];
  if (singleLetterVars.length > 5 && code.length > 200) score -= 5;

  // Check for consistent indentation
  const hasInconsistentIndentation = checkInconsistentIndentation(lines);
  if (hasInconsistentIndentation) score -= 5;

  return Math.max(0, score);
};

/**
 * Analyze code efficiency based on execution metrics
 */
const analyzeEfficiency = (testResults) => {
  if (!testResults || testResults.length === 0) return 15; // Moderate score if no data

  let score = 30; // Start with perfect score

  // Analyze execution times
  const executionTimes = testResults.map(r => r.time || 0).filter(t => t > 0);
  
  if (executionTimes.length > 0) {
    const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
    const maxTime = Math.max(...executionTimes);

    // Penalize slow execution
    if (avgTime > 1.0) score -= 5; // > 1 second average
    if (avgTime > 2.0) score -= 5; // > 2 seconds average
    if (maxTime > 3.0) score -= 5; // > 3 seconds for any test
    if (maxTime > 5.0) score -= 5; // > 5 seconds for any test
  }

  // Analyze memory usage if available
  const memoryUsages = testResults.map(r => r.memory || 0).filter(m => m > 0);
  
  if (memoryUsages.length > 0) {
    const avgMemory = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;
    
    // Penalize high memory usage (in KB)
    if (avgMemory > 50000) score -= 5; // > 50MB
    if (avgMemory > 100000) score -= 5; // > 100MB
  }

  return Math.max(0, score);
};

/**
 * Analyze adherence to best practices
 */
const analyzeBestPractices = (code, language) => {
  let score = 30; // Start with perfect score

  // Language-specific checks
  switch (language.toLowerCase()) {
    case 'python':
      score = analyzePythonBestPractices(code, score);
      break;
    case 'javascript':
      score = analyzeJavaScriptBestPractices(code, score);
      break;
    case 'java':
      score = analyzeJavaBestPractices(code, score);
      break;
    case 'c':
    case 'cpp':
      score = analyzeCCppBestPractices(code, score);
      break;
  }

  // Universal checks
  // Check for magic numbers (hardcoded values)
  const magicNumbers = code.match(/\b\d{3,}\b/g) || [];
  if (magicNumbers.length > 3) score -= 3;

  // Check for code duplication (very basic check)
  const lines = code.split('\n').filter(l => l.trim().length > 10);
  const uniqueLines = new Set(lines);
  const duplicationRatio = 1 - (uniqueLines.size / Math.max(lines.length, 1));
  if (duplicationRatio > 0.3) score -= 5;

  return Math.max(0, score);
};

/**
 * Python-specific best practices
 */
const analyzePythonBestPractices = (code, score) => {
  // Check for list comprehensions usage (good practice)
  const hasListComp = /\[.*for.*in.*\]/.test(code);
  
  // Check for proper exception handling
  const hasExceptionHandling = /try:|except:/.test(code);
  
  // Check for with statement usage (resource management)
  const hasWithStatement = /with\s+\w+/.test(code);
  
  // Penalize if code is long but lacks best practices
  if (code.length > 300 && !hasExceptionHandling) score -= 3;
  
  return score;
};

/**
 * JavaScript-specific best practices
 */
const analyzeJavaScriptBestPractices = (code, score) => {
  // Check for var usage (should use let/const)
  const hasVar = /\bvar\s+/.test(code);
  if (hasVar) score -= 5;
  
  // Check for const usage (good practice)
  const hasConst = /\bconst\s+/.test(code);
  
  // Check for arrow functions
  const hasArrowFunctions = /=\s*\(/.test(code) || /=>\s*{/.test(code);
  
  return score;
};

/**
 * Java-specific best practices
 */
const analyzeJavaBestPractices = (code, score) => {
  // Check for proper access modifiers
  const hasAccessModifiers = /\b(private|public|protected)\s+/.test(code);
  
  // Check for proper exception handling
  const hasExceptionHandling = /try\s*{|catch\s*\(/.test(code);
  
  return score;
};

/**
 * C/C++ specific best practices
 */
const analyzeCCppBestPractices = (code, score) => {
  // Check for memory leaks risk (malloc without free, new without delete)
  const hasMalloc = /\bmalloc\s*\(/.test(code);
  const hasFree = /\bfree\s*\(/.test(code);
  if (hasMalloc && !hasFree) score -= 5;
  
  const hasNew = /\bnew\s+/.test(code);
  const hasDelete = /\bdelete\s+/.test(code);
  if (hasNew && !hasDelete) score -= 5;
  
  return score;
};

/**
 * Check for inconsistent indentation
 */
const checkInconsistentIndentation = (lines) => {
  const indentations = lines
    .filter(line => line.trim().length > 0)
    .map(line => {
      const match = line.match(/^[\s\t]*/);
      return match ? match[0] : '';
    })
    .filter(indent => indent.length > 0);

  if (indentations.length === 0) return false;

  // Check if mixing tabs and spaces
  const hasTabs = indentations.some(i => i.includes('\t'));
  const hasSpaces = indentations.some(i => i.includes(' '));

  return hasTabs && hasSpaces;
};

/**
 * Get quality rating from score
 */
const getQualityRating = (score) => {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Needs Improvement';
};

/**
 * Calculate overall battle score combining correctness, quality, and speed
 * @param {number} correctness - Percentage of test cases passed (0-100)
 * @param {number} qualityScore - Code quality score (0-100)
 * @param {number} executionTime - Total execution time in seconds
 * @param {number} timeLimit - Time limit for the problem in seconds
 * @returns {Object} Overall score breakdown
 */
export const calculateBattleScore = (correctness, qualityScore, executionTime, timeLimit = 1800) => {
  // Weighted scoring:
  // - Correctness: 50%
  // - Quality: 30%
  // - Speed: 20%

  const correctnessPoints = (correctness / 100) * 50;
  const qualityPoints = (qualityScore / 100) * 30;
  
  // Speed calculation: faster is better, diminishing returns
  // If executionTime is 0 or very small, give full points
  // If executionTime approaches timeLimit, give fewer points
  const speedRatio = Math.max(0, 1 - (executionTime / timeLimit));
  const speedPoints = speedRatio * 20;

  const totalScore = Math.round(correctnessPoints + qualityPoints + speedPoints);

  return {
    totalScore,
    breakdown: {
      correctness: Math.round(correctnessPoints),
      quality: Math.round(qualityPoints),
      speed: Math.round(speedPoints)
    },
    percentages: {
      correctness: Math.round(correctness),
      quality: Math.round(qualityScore),
      speed: Math.round(speedRatio * 100)
    }
  };
};
