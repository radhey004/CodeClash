import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy initialization - only create the client when actually needed
let genAI = null;

// Rate limiting state
const rateLimitState = {
  lastRequestTime: 0,
  requestCount: 0,
  resetTime: 0,
  isQuotaExceeded: false,
  quotaResetTime: 0
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Parse retry delay from Gemini error response
 */
const parseRetryDelay = (error) => {
  if (error.errorDetails) {
    const retryInfo = error.errorDetails.find(detail => 
      detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
    );
    if (retryInfo?.retryDelay) {
      // Parse delay like "27s" or "27.071653477s"
      const match = retryInfo.retryDelay.match(/([\d.]+)s/);
      if (match) {
        return Math.ceil(parseFloat(match[1]) * 1000); // Convert to ms
      }
    }
  }
  return null;
};

/**
 * Check if error is a quota/rate limit error
 */
const isQuotaError = (error) => {
  return error.status === 429 || 
         (error.message && error.message.includes('quota')) ||
         (error.message && error.message.includes('rate limit'));
};

/**
 * Retry wrapper with exponential backoff for Gemini API calls
 */
const retryWithBackoff = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check if we're in a known quota exceeded state
      if (rateLimitState.isQuotaExceeded && Date.now() < rateLimitState.quotaResetTime) {
        const waitTime = rateLimitState.quotaResetTime - Date.now();
        throw new Error(`Quota exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
      }
      
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if it's a quota error
      if (isQuotaError(error)) {
        const retryDelay = parseRetryDelay(error);
        
        if (retryDelay) {
          // Store quota state
          rateLimitState.isQuotaExceeded = true;
          rateLimitState.quotaResetTime = Date.now() + retryDelay;
          
          console.log(`⏳ Quota exceeded. Need to wait ${Math.ceil(retryDelay / 1000)}s before retry.`);
          
          // If this is the last attempt or delay is too long, don't retry
          if (attempt === maxRetries || retryDelay > maxDelay) {
            throw new Error(
              `Gemini API quota exceeded. The free tier limit (20 requests/day) has been reached. ` +
              `Please wait ${Math.ceil(retryDelay / 1000)} seconds or upgrade your API plan. ` +
              `See: https://ai.google.dev/gemini-api/docs/rate-limits`
            );
          }
          
          await sleep(retryDelay);
          continue;
        }
      }
      
      // For other errors, retry with exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.min(initialDelay * Math.pow(backoffMultiplier, attempt), maxDelay);
        console.log(`⚠️ Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        // Max retries reached
        break;
      }
    }
  }
  
  // Clear quota state if it was successful before throwing
  if (lastError && !isQuotaError(lastError)) {
    rateLimitState.isQuotaExceeded = false;
    rateLimitState.quotaResetTime = 0;
  }
  
  throw lastError;
};

const getGenAI = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY is not set in environment variables');
      throw new Error('GEMINI_API_KEY is not configured');
    }
    
    // Trim whitespace that might have been accidentally added
    const trimmedKey = apiKey.trim();
    console.log('✅ Initializing Gemini AI');
    console.log('   Key preview:', trimmedKey.substring(0, 15) + '...' + trimmedKey.substring(trimmedKey.length - 4));
    console.log('   Key length:', trimmedKey.length, '(should be 39)');
    
    genAI = new GoogleGenerativeAI(trimmedKey);
  }
  return genAI;
};

/**
 * Generate a coding problem based on user's league, level, and XP
 * @param {Object} userProfile - User profile containing league, level, xp
 * @returns {Promise<Object>} Generated problem
 */
export const generateProblem = async (userProfile) => {
  const { league, level, xp } = userProfile;

  // Determine difficulty based on league and level
  let difficulty = 'Easy';
  let difficultyContext = '';
  
  if (league === 'Unranked' || league === 'Bronze League') {
    difficulty = 'Easy';
    difficultyContext = 'beginner-friendly, focusing on basic algorithms and data structures';
  } else if (league === 'Silver League' || league === 'Gold League') {
    difficulty = level > 10 ? 'Medium' : 'Easy';
    difficultyContext = 'intermediate level, involving moderate algorithmic thinking';
  } else if (league === 'Crystal League' || league === 'Master League') {
    difficulty = 'Medium';
    difficultyContext = 'challenging, requiring solid algorithmic knowledge';
  } else {
    difficulty = 'Hard';
    difficultyContext = 'advanced, requiring expert-level problem-solving skills';
  }

  const prompt = `Generate a unique coding problem for a competitive programming platform.

User Profile:
- League: ${league}
- Level: ${level}
- XP: ${xp}
- Difficulty: ${difficulty}

Requirements:
- Create a ${difficultyContext} problem
- The problem should be unique and interesting
- Include a clear problem description with examples
- Provide 5-7 test cases (mix of visible and hidden)
- Set appropriate XP reward based on difficulty (Easy: 30-50, Medium: 60-100, Hard: 120-200)
- Time limit should be 300-600ms
- IMPORTANT: Use plain text for math (e.g., "N nodes", "<=", ">=", "*", "sum of", "product of") instead of LaTeX notation to ensure JSON compatibility
- Keep descriptions clear but avoid special characters that need escaping

CRITICAL TEST CASE REQUIREMENTS:
1. You MUST manually verify each test case by working through the problem logic step-by-step
2. For EACH test case, show your verification in your thinking before finalizing
3. Double-check that the expected output matches what the algorithm should produce
4. Include edge cases: smallest valid input, largest within constraints, and typical cases
5. Mark 2-3 test cases as visible (isHidden: false) and the rest as hidden (isHidden: true)
6. Ensure all test cases are consistent with the problem description and examples

VERIFICATION PROCESS (think through this before generating JSON):
- Read the problem carefully
- For each test case input, manually calculate what the correct output should be
- Verify the output matches the problem's requirements exactly
- Check for off-by-one errors, edge cases, and boundary conditions

Return the response in the following JSON format:
{
  "title": "Problem title",
  "description": "Detailed problem description with examples",
  "difficulty": "${difficulty}",
  "constraints": ["constraint1", "constraint2", ...],
  "testCases": [
    {"input": "test input", "output": "expected output", "isHidden": false},
    ...
  ],
  "timeLimit": 1800,
  "xpReward": 50
}

Make the problem creative and ensure test cases are 100% accurate and properly validate the solution.`;

  try {
    // Use retry wrapper for API call
    const text = await retryWithBackoff(async () => {
      const model = getGenAI().getGenerativeModel({ 
        model: "gemini-2.5-flash-lite",
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    }, {
      maxRetries: 2,
      initialDelay: 1000,
      maxDelay: 30000
    });
    
    console.log('📝 Gemini raw response preview:', text.substring(0, 200) + '...');
    
    // Extract JSON from markdown code blocks if present
    let jsonText = text.trim();
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    } else {
      // Try to find JSON without markdown
      const plainJsonMatch = text.match(/\{[\s\S]*\}/);
      if (plainJsonMatch) {
        jsonText = plainJsonMatch[0];
      }
    }
    
    let problemData;
    let lastError = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        problemData = JSON.parse(jsonText);
        break;
      } catch (parseError) {
        lastError = parseError;
        console.error(`❌ JSON Parse Error (attempt ${attempt + 1}):`, parseError.message);
        console.error('📄 Problematic JSON text (first 1000 chars):', jsonText.substring(0, 1000));
        // Try to fix common JSON issues, especially LaTeX notation
        let fixedJson = jsonText;
        // Remove trailing commas before } or ]
        fixedJson = fixedJson.replace(/,\s*([}\]])/g, '$1');
        // Protect valid JSON escape sequences
        const escapeMap = new Map();
        let escapeCounter = 0;
        fixedJson = fixedJson.replace(/\\["\\\/bfnrtu]/g, (match) => {
          const placeholder = `___ESCAPE_${escapeCounter++}___`;
          escapeMap.set(placeholder, match);
          return placeholder;
        });
        // Escape all remaining single backslashes
        fixedJson = fixedJson.replace(/\\/g, '\\\\');
        // Restore the original valid escape sequences
        escapeMap.forEach((value, key) => {
          fixedJson = fixedJson.replace(key, value);
        });
        // Remove actual newlines and tabs
        fixedJson = fixedJson.replace(/\n/g, ' ').replace(/\t/g, ' ');
        // Remove any non-printable/control characters
        fixedJson = fixedJson.replace(/[\x00-\x1F\x7F]/g, '');
        // Try to parse again
        try {
          problemData = JSON.parse(fixedJson);
          console.log('✅ Successfully parsed fixed JSON');
          break;
        } catch (secondError) {
          lastError = secondError;
          console.error(`❌ Still failed after fixing (attempt ${attempt + 1}):`, secondError.message);
          console.error('📄 Fixed JSON (first 1000 chars):', fixedJson.substring(0, 1000));
          if (attempt === 0) {
            // On first failure, try to regenerate problem
            console.warn('🔄 Retrying Gemini API call to regenerate problem...');
            const retryResult = await retryWithBackoff(async () => {
              const model = getGenAI().getGenerativeModel({ 
                model: "gemini-2.5-flash-lite",
                generationConfig: {
                  temperature: 0.7,
                  responseMimeType: "application/json"
                }
              });
              const result = await model.generateContent(prompt);
              const response = await result.response;
              return response.text();
            }, {
              maxRetries: 1,
              initialDelay: 1000,
              maxDelay: 5000
            });
            jsonText = retryResult.trim();
            const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
              jsonText = jsonMatch[1].trim();
            } else {
              const plainJsonMatch = jsonText.match(/\{[\s\S]*\}/);
              if (plainJsonMatch) {
                jsonText = plainJsonMatch[0];
              }
            }
          }
        }
      }
    }
    if (!problemData) {
      throw lastError || new Error('Failed to parse Gemini API response as JSON');
    }
    
    // Validate test cases
    if (!problemData.testCases || problemData.testCases.length < 3) {
      console.warn('⚠️ Warning: Problem has fewer than 3 test cases. Requesting regeneration.');
      throw new Error('Insufficient test cases generated');
    }
    
    // Log test cases for review
    console.log('📋 Generated test cases:');
    problemData.testCases.forEach((tc, i) => {
      console.log(`   Test ${i + 1}: Input="${tc.input?.substring(0, 50)}${tc.input?.length > 50 ? '...' : ''}" Output="${tc.output?.substring(0, 50)}${tc.output?.length > 50 ? '...' : ''}" Hidden=${tc.isHidden}`);
    });
    
    // Ensure at least some test cases are visible
    const visibleCount = problemData.testCases.filter(tc => !tc.isHidden).length;
    if (visibleCount === 0) {
      console.log('⚠️ Making first 2 test cases visible for user reference');
      problemData.testCases[0].isHidden = false;
      if (problemData.testCases.length > 1) {
        problemData.testCases[1].isHidden = false;
      }
    }
    
    return problemData;
  } catch (error) {
    console.error('Error generating problem with Gemini:', error);
    
    // Provide specific error messages based on error type
    if (isQuotaError(error)) {
      const retryDelay = parseRetryDelay(error);
      const waitTime = retryDelay ? Math.ceil(retryDelay / 1000) : 'a few minutes';
      throw new Error(
        `Gemini API quota exceeded. Free tier limit reached (20 requests/day). ` +
        `Please wait ${waitTime} seconds or upgrade your plan. ` +
        `Visit: https://ai.google.dev/gemini-api/docs/rate-limits`
      );
    }
    
    if (error.status === 401 || error.message?.includes('API key')) {
      throw new Error('Invalid Gemini API key. Please check your GEMINI_API_KEY environment variable.');
    }
    
    if (error.status === 503) {
      throw new Error('Gemini API is temporarily unavailable. Please try again in a few moments.');
    }
    
    // Generic error
    throw new Error(`Failed to generate problem: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Generate AI-powered post-match editorial
 * @param {Object} problem - The problem that was solved
 * @param {Object} solution - User's solution (code, language)
 * @param {Object} battleData - Battle statistics (time, test cases passed, etc.)
 * @returns {Promise<Object>} Generated editorial
 */
export const generateEditorial = async (problem, solution, battleData) => {
  const prompt = `Generate a comprehensive, modern post-match editorial for a coding problem.

Problem:
Title: ${problem.title}
Description: ${problem.description}
Difficulty: ${problem.difficulty}

User's Solution:
Language: ${solution?.language || 'Not provided'}
Code: ${solution?.code || 'Not available'}
Test Cases Passed: ${battleData?.testCasesPassed || 0}/${battleData?.totalTestCases || 0}
Execution Time: ${battleData?.executionTime || 0}ms

Create an engaging, educational editorial that helps the user learn and improve. Include:
1. A brief summary explaining the problem's core concept
2. The optimal approach to solve it
3. Example solution code (provide a working solution in ${solution?.language || 'JavaScript or Python'})
4. Time and space complexity analysis
5. Key takeaways (3-5 important points)
6. Common mistakes to avoid (2-4 points)

Return the response in the following JSON format:
{
  "summary": "Brief explanation of the problem and its key insights (2-3 sentences)",
  "approach": "Step-by-step explanation of the optimal approach with clear reasoning",
  "optimalSolution": "A complete, working code example that solves the problem efficiently (in ${solution?.language || 'JavaScript or Python'})",
  "timeComplexity": "Time complexity in O() notation (e.g., O(n), O(n log n), O(1))",
  "spaceComplexity": "Space complexity in O() notation (e.g., O(n), O(1))",
  "keyTakeaways": ["takeaway1", "takeaway2", "takeaway3"],
  "commonMistakes": ["mistake1", "mistake2"]
}

Make it educational, encouraging, and modern in tone. If the user's solution was provided, acknowledge their approach.`;

  try {
    // Use retry wrapper for API call
    const text = await retryWithBackoff(async () => {
      const model = getGenAI().getGenerativeModel({ 
        model: "gemini-2.5-flash-lite",
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    }, {
      maxRetries: 2,
      initialDelay: 1000,
      maxDelay: 30000
    });
    
    // Extract JSON from markdown code blocks if present
    let jsonText = text.trim();
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    } else {
      const plainJsonMatch = text.match(/\{[\s\S]*\}/);
      if (plainJsonMatch) {
        jsonText = plainJsonMatch[0];
      }
    }
    
    let editorial;
    try {
      editorial = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('❌ Editorial JSON Parse Error:', parseError.message);
      
      // Try to fix common JSON issues, especially LaTeX notation
      let fixedJson = jsonText;
      
      const escapeMap = new Map();
      let escapeCounter = 0;
      
      // Protect valid JSON escape sequences
      fixedJson = fixedJson.replace(/\\["\\\/bfnrtu]/g, (match) => {
        const placeholder = `___ESCAPE_${escapeCounter++}___`;
        escapeMap.set(placeholder, match);
        return placeholder;
      });
      
      // Escape remaining backslashes (LaTeX notation)
      fixedJson = fixedJson.replace(/\\/g, '\\\\');
      
      // Restore valid escape sequences
      escapeMap.forEach((value, key) => {
        fixedJson = fixedJson.replace(key, value);
      });
      
      // Remove actual newlines and tabs
      fixedJson = fixedJson.replace(/\n/g, ' ').replace(/\t/g, ' ');
      
      try {
        editorial = JSON.parse(fixedJson);
        console.log('✅ Successfully parsed fixed editorial JSON');
      } catch (secondError) {
        console.error('❌ Editorial still failed after fixing:', secondError.message);
        throw secondError;
      }
    }
    
    return editorial;
  } catch (error) {
    console.error('Error generating editorial with Gemini:', error);
    
    if (isQuotaError(error)) {
      const retryDelay = parseRetryDelay(error);
      const waitTime = retryDelay ? Math.ceil(retryDelay / 1000) : 'a few minutes';
      throw new Error(
        `Gemini API quota exceeded. Please wait ${waitTime} seconds or upgrade your plan.`
      );
    }
    
    throw new Error(`Failed to generate editorial: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Generate a quick hint for a problem (for future feature)
 * @param {Object} problem - The problem
 * @returns {Promise<string>} Generated hint
 */
export const generateHint = async (problem) => {
  const prompt = `Provide a helpful hint for this coding problem. Don't give away the solution, but guide the user toward the right approach.

Problem: ${problem.title}
Description: ${problem.description}

Provide a single, concise hint (2-3 sentences) that helps the user think in the right direction.`;

  try {
    return await retryWithBackoff(async () => {
      const model = getGenAI().getGenerativeModel({ model: "gemini-2.5-flash-lite" });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    });
  } catch (error) {
    console.error('Error generating hint with Gemini:', error);
    
    if (isQuotaError(error)) {
      throw new Error('Gemini API quota exceeded. Please try again later.');
    }
    
    throw new Error(`Failed to generate hint: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Generate AI-powered code improvement suggestions
 * @param {Object} problem - The problem
 * @param {string} code - Player's code
 * @param {string} language - Programming language
 * @param {number} testCasesPassed - Number of test cases passed
 * @param {number} totalTestCases - Total number of test cases
 * @returns {Promise<Array<string>>} Array of improvement suggestions
 */
export const generateCodeImprovements = async (problem, code, language, testCasesPassed, totalTestCases) => {
  const allTestsPassed = testCasesPassed === totalTestCases;
  
  const prompt = `Analyze this code submission and provide 3-5 specific, actionable improvement suggestions.

Problem: ${problem.title}
Description: ${problem.description}

Language: ${language}
Test Cases Passed: ${testCasesPassed}/${totalTestCases}

Code:
\`\`\`${language}
${code}
\`\`\`

Focus on:
1. Code optimization and efficiency improvements
2. Better variable names and code readability
3. Edge case handling
4. Algorithm complexity improvements
5. Best practices for ${language}
${!allTestsPassed ? '6. Why the code might be failing some test cases' : ''}

Return ONLY a JSON array of strings, each being one improvement suggestion. Keep each suggestion concise (1-2 sentences).
Example format: ["Use descriptive variable names instead of single letters", "Consider using a hash map for O(1) lookup time", ...]`;

  try {
    const text = await retryWithBackoff(async () => {
      const model = getGenAI().getGenerativeModel({ 
        model: "gemini-2.5-flash-lite",
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    });
    
    const improvements = JSON.parse(text);
    return Array.isArray(improvements) ? improvements : [];
  } catch (error) {
    console.error('Error generating code improvements with Gemini:', error);
    
    // Return fallback suggestions for any error
    if (isQuotaError(error)) {
      console.log('📊 Using fallback suggestions due to quota limit');
    }
    
    return [
      "Review your algorithm for potential optimizations",
      "Consider edge cases that might not be handled",
      "Ensure your variable names are descriptive and meaningful"
    ];
  }
};
