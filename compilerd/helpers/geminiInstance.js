const { GoogleGenerativeAI } = require('@google/generative-ai');
const { LangfuseClient } = require('@langfuse/client'); 
const {
    geminiConfig,
    langfuseConfig
} = require('../configs/app.config');

let geminiClient = null;
const instantiateGemini = () => {
    if (!geminiClient && geminiConfig.API_KEY) {
        geminiClient = new GoogleGenerativeAI(geminiConfig.API_KEY);
    }
    return geminiClient;
};

const getGemini = () => {
    return geminiClient || instantiateGemini();
};

let baseLangfuseClient;
const instantiateLangfuse = () => {
    if (langfuseConfig.publicKey && langfuseConfig.secretKey && langfuseConfig.baseUrl) {
        baseLangfuseClient = new LangfuseClient(langfuseConfig);
    } else {
        baseLangfuseClient = null;
    }
    
    return baseLangfuseClient;
};

const getLangfuse = (metadata = {}) => {
    return baseLangfuseClient || instantiateLangfuse();
};

const getLangfusePromptClient = (() => {
    let langfusePromptClient = null;
    return () => {
        if (!langfusePromptClient && langfuseConfig.publicKey) {
            langfusePromptClient = new LangfuseClient(langfuseConfig);
        }
        return langfusePromptClient;
    }
})();

/**
 * Generate content using Gemini AI with Langfuse tracking
 * @param {string} prompt - The prompt to send to Gemini
 * @param {Object} metadata - Metadata for Langfuse tracking
 * @returns {Promise<string>} Generated content
 */
const generateWithGemini = async (prompt, metadata = {}) => {
    const gemini = getGemini();
    if (!gemini) {
        throw new Error('Gemini client not initialized. Check GEMINI_API_KEY.');
    }

    const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Track with Langfuse if available
    const langfuse = getLangfuse();
    let trace = null;
    let generation = null;

    try {
        if (langfuse) {
            trace = langfuse.trace({
                name: metadata.traceName || 'gemini-generation',
                userId: metadata.userId,
                sessionId: metadata.sessionId,
                tags: metadata.tags || [],
                metadata: metadata
            });

            generation = trace.generation({
                name: metadata.generationName || 'gemini-response',
                model: 'gemini-1.5-flash',
                input: prompt,
                metadata: metadata
            });
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (generation) {
            generation.end({
                output: text,
                usage: {
                    promptTokens: result.promptTokenCount || 0,
                    completionTokens: result.candidatesTokenCount || 0,
                    totalTokens: (result.promptTokenCount || 0) + (result.candidatesTokenCount || 0)
                }
            });
        }

        return text;
    } catch (error) {
        if (generation) {
            generation.end({
                statusMessage: error.message,
                level: 'ERROR'
            });
        }
        throw error;
    }
};

module.exports = {
    instantiateGemini,
    getGemini,
    instantiateLangfuse,
    getLangfuse,
    getLangfusePromptClient,
    generateWithGemini
};
