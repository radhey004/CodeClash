const axios = require('axios')
const { testCases } = require('./data/testJson')
const { describe, expect, it } = require('@jest/globals')

const ENDPOINT = process.env.ENDPOINT || 'http://localhost:3000/api/execute/'

describe('Tests', () => {
    for (const testCase of testCases) {
        it(testCase.name, async () => {
            const response = await axios.post(ENDPOINT, testCase.reqObject)
            
            // Check basic response structure
            expect(response.status).toBe(testCase.expectedResponse.status)
            expect(response.data.error).toBe(testCase.expectedResponse.error)
            
            // For AI evaluation, just check that output exists and is an object
            if (typeof response.data.output === 'object' && response.data.output !== null) {
                expect(response.data.output).toBeDefined()
            } else {
                // For code execution, check the output matches
                expect(response.data.output).toBe(testCase.expectedResponse.val)
            }
        }, 15000)
    }
})
