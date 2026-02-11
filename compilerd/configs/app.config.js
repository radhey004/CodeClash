module.exports = {
    multifile: {
        staticServerPath: "/tmp/submission/",
        submissionFileDownloadPath: "/tmp/submission.json",
        workingDir: "/tmp/submission/",
        jasminePort: process.env.JASMINE_PORT || 8888,
    },
    dbConfig: {
        PATH: "/tmp/database.db",
    },
    geminiConfig: {
        API_KEY: process.env.GEMINI_API_KEY,
        SUBJECTIVE_MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite"
    },
    langfuseConfig: {
        publicKey:process.env.LANGFUSE_PUBLIC_KEY, 
        secretKey:process.env.LANGFUSE_SECRET_KEY,
        baseUrl:process.env.LANGFUSE_BASE_URL,
        promptName:process.env.LANGFUSE_PROMPT_NAME || "subjective_prompt"
    }
    
}
