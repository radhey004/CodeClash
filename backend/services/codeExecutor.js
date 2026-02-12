import axios from 'axios';

const LANGUAGE_MAP = {
  c: 'c', cpp: 'cpp', java: 'java', python: 'python', javascript: 'nodejs'
};

const COMPILER_URL = process.env.COMPILER_SERVICE_URL || 'https://codeclash-czhz.onrender.com';

const normalizeOutput = (str) => str ? str.toString().replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').map(line => line.trimEnd()).join('\n').trim() : '';

const getErrorMessage = (result) => {
  if (result.compile_message) {
    return result.compile_message.includes('bits/stdc++.h') 
      ? 'Compilation Error: bits/stdc++.h is not available. Please use standard headers like #include <iostream>, #include <vector>, etc.'
      : 'Compilation Error: ' + result.compile_message;
  }
  if (result.output?.includes('Memory exceeded')) return 'Memory Limit Exceeded';
  if (result.output?.includes('Time limit exceeded')) return 'Time Limit Exceeded';
  return 'Runtime Error: ' + (result.output || 'Code execution failed');
};

const analyzeOutputDifference = (actual, expected) => {
  const actualLines = actual.split('\n');
  const expectedLines = expected.split('\n');
  
  // Check if outputs are completely empty
  if (!actual && !expected) {
    return { type: 'match', details: null };
  }
  
  // Check if one is empty but not the other
  if (!actual && expected) {
    return {
      type: 'empty_output',
      details: `Expected output but got empty result.\nExpected: "${expected.substring(0, 100)}${expected.length > 100 ? '...' : ''}"`
    };
  }
  
  if (actual && !expected) {
    return {
      type: 'unexpected_output',
      details: `Expected empty output but got: "${actual.substring(0, 100)}${actual.length > 100 ? '...' : ''}"`
    };
  }
  
  // Check line count difference
  if (actualLines.length !== expectedLines.length) {
    return {
      type: 'line_count_mismatch',
      details: `Line count mismatch:\n• Expected ${expectedLines.length} line(s)\n• Got ${actualLines.length} line(s)\n\nExpected output:\n${expectedLines.slice(0, 3).join('\n')}${expectedLines.length > 3 ? '\n...' : ''}\n\nYour output:\n${actualLines.slice(0, 3).join('\n')}${actualLines.length > 3 ? '\n...' : ''}`
    };
  }
  
  // Find first differing line
  for (let i = 0; i < expectedLines.length; i++) {
    if (actualLines[i] !== expectedLines[i]) {
      const exp = expectedLines[i];
      const act = actualLines[i];
      
      // Check for whitespace issues
      if (exp.trim() === act.trim()) {
        return {
          type: 'whitespace_difference',
          details: `Whitespace difference on line ${i + 1}:\n\nExpected: "${exp}"\nGot:      "${act}"\n          ${' '.repeat(11)}${'~'.repeat(Math.max(exp.length, act.length))}\n\n💡 Tip: Check for extra spaces, tabs, or trailing whitespace`
        };
      }
      
      // Find first differing character
      let diffPos = 0;
      while (diffPos < Math.min(exp.length, act.length) && exp[diffPos] === act[diffPos]) {
        diffPos++;
      }
      
      // Create visual indicator
      const contextStart = Math.max(0, diffPos - 10);
      const contextEnd = Math.min(exp.length, diffPos + 20);
      const expContext = exp.substring(contextStart, contextEnd);
      const actContext = act.substring(contextStart, Math.min(act.length, diffPos + 20));
      const pointer = ' '.repeat(diffPos - contextStart) + '^';
      
      return {
        type: 'content_mismatch',
        details: `Output mismatch on line ${i + 1}, character ${diffPos + 1}:\n\nExpected: "${expContext}${contextEnd < exp.length ? '...' : ''}"\n          ${pointer}\nGot:      "${actContext}${diffPos + 20 < act.length ? '...' : ''}"\n\nFull line comparison:\nExpected: "${exp}"\nGot:      "${act}"\n\n💡 ${diffPos === 0 ? 'Difference from the start of the line' : `Matched until position ${diffPos}: "${exp.substring(0, diffPos)}"`}`
      };
    }
  }
  
  // Check for trailing whitespace or newlines
  if (actual !== expected) {
    return {
      type: 'trailing_difference',
      details: 'Outputs differ in trailing whitespace or newlines.\n\n💡 Tip: Ensure output ends exactly as expected without extra newlines or spaces'
    };
  }
  
  return { type: 'match', details: null };
};

export const executeCode = async (code, language, testCases) => {
  const mappedLanguage = LANGUAGE_MAP[language.toLowerCase()];
  if (!mappedLanguage) throw new Error(`Unsupported language: ${language}`);

  const results = [];
  for (let i = 0; i < testCases.length; i++) {
    try {
      const { data: result } = await axios.post(`${'https://codeclash-czhz.onrender.com'}/api/execute`, {
        language: mappedLanguage,
        script: code,
        stdin: testCases[i].input || '',
        hasInputFiles: false
      }, { timeout: 10000, headers: { 'Content-Type': 'application/json' } });

      const actualOutput = normalizeOutput(result.output);
      const expectedOutput = normalizeOutput(testCases[i].output);
      
      let error = null;
      let statusDescription = 'Accepted';
      let diffAnalysis = null;
      
      if (result.error) {
        error = getErrorMessage(result);
        statusDescription = error;
      } else if (actualOutput !== expectedOutput) {
        const analysis = analyzeOutputDifference(actualOutput, expectedOutput);
        diffAnalysis = analysis.details;
        
        switch (analysis.type) {
          case 'line_count_mismatch':
            error = `Wrong Answer: ${analysis.details}`;
            statusDescription = 'Wrong Answer - Line Count Mismatch';
            break;
          case 'whitespace_difference':
            error = `Wrong Answer: ${analysis.details}`;
            statusDescription = 'Wrong Answer - Whitespace Error';
            break;
          case 'content_mismatch':
            error = `Wrong Answer: ${analysis.details}`;
            statusDescription = 'Wrong Answer - Output Mismatch';
            break;
          case 'trailing_difference':
            error = `Wrong Answer: ${analysis.details}`;
            statusDescription = 'Wrong Answer - Formatting Error';
            break;
          default:
            error = 'Wrong Answer';
            statusDescription = 'Wrong Answer';
        }
      }
      
      const passed = !error;

      results.push({
        passed,
        output: actualOutput,
        expected: expectedOutput,
        time: result.execute_time || 0,
        memory: result.memory || 0,
        error,
        statusDescription,
        diffAnalysis,
        testCaseNumber: i + 1,
        inputPreview: testCases[i].input ? (
          testCases[i].input.length > 200 
            ? testCases[i].input.substring(0, 200) + '... (truncated)' 
            : testCases[i].input
        ) : '(empty input)',
        isHidden: testCases[i].isHidden || false
      });
    } catch (error) {
      // Enhanced logging for debugging
      console.error('Error executing code via compiler service:', {
        message: error.message,
        code: error.code,
        responseData: error.response?.data,
        responseStatus: error.response?.status,
        stack: error.stack
      });
      const errorMessage = error.code === 'ECONNREFUSED'
        ? `Compiler service unavailable. Please ensure the compiler service is running and accessible at ${'https://codeclash-czhz.onrender.com'} (current setting).`
        : error.response?.data?.message || error.response?.statusText || 'Execution failed: ' + error.message;

      results.push({
        passed: false,
        error: errorMessage,
        output: '',
        expected: testCases[i].output,
        time: 0,
        memory: 0,
        statusDescription: 'Execution Error',
        diffAnalysis: `Failed to execute test case ${i + 1}\n\nError: ${errorMessage}`,
        testCaseNumber: i + 1,
        inputPreview: testCases[i].input ? (
          testCases[i].input.length > 200 
            ? testCases[i].input.substring(0, 200) + '... (truncated)' 
            : testCases[i].input
        ) : '(empty input)',
        isHidden: testCases[i].isHidden || false
      });
    }
  }
  return results;
};
