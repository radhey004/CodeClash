require('./envloader')()
require('./instrumentation');


const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})
const cors = require('cors')
const compression = require('compression')
const helmet = require('helmet')
const baseRouter = require('./router.js')
const morgan = require('morgan')
const PORT = process.env.PORT || 3000
const { respond, l } = require('./loader.js').helpers
const { instantiateLangfuse } = require('./helpers/geminiInstance.js')
instantiateLangfuse()

require('./loader.js').loadDependency(app)

/* Middlewares */
app.use(express.json())
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return respond(res, 400, { message: 'Invalid JSON found' })
    }
    next()
})
// Log all api requests
app.use(
    morgan(
        'REQUEST [:date[clf]] ":method :url HTTP/:http-version" :status :user-agent',
        {
            immediate: true,
            skip: function (req) { return (req.path === '/api/') },
        },
    ),
)
app.use(
    express.urlencoded({
        extended: true,
        limit: '2mb',
        parameterLimit: 10000,
    }),
)

app.use(compression())
app.use(helmet())
app.use(cors())

app.use('/api/', baseRouter)

app.get('/', (req, res) => {
    return res.send('Compiler is up and working')
})



// Import the code execution service
const codeService = require('./services/code.service.js');

// Basic Socket.IO connection handler
io.on('connection', (socket) => {
    l.info('Socket.IO client connected:', socket.id)
    socket.on('disconnect', () => {
        l.info('Socket.IO client disconnected:', socket.id)
    })

    // Real code submission handler
    socket.on('submit-code', async (data) => {
        l.info('Received submit-code event:', data?.userId, data?.language);
        try {
            // Prepare a mock req/res for codeService.execute
            const req = {
                script: data.code,
                language: data.language,
                stdin: data.stdin || '',
                // Add more fields as needed from data
            };
            // No real res object needed, just for compatibility
            const res = {};
            const execResult = await codeService.execute(req, res);

            // Transform result for frontend
            let testCasesPassed = 0;
            let totalTestCases = 0;
            let results = [];
            let success = false;

            // If execResult.results exists, use it; else, try to infer
            if (Array.isArray(execResult.results)) {
                results = execResult.results;
                totalTestCases = results.length;
                testCasesPassed = results.filter(r => r.passed).length;
                success = testCasesPassed === totalTestCases && totalTestCases > 0;
            } else if (typeof execResult.output === 'object' && Array.isArray(execResult.output.results)) {
                results = execResult.output.results;
                totalTestCases = results.length;
                testCasesPassed = results.filter(r => r.passed).length;
                success = testCasesPassed === totalTestCases && totalTestCases > 0;
            } else {
                // Fallback: treat as single test case
                totalTestCases = 1;
                testCasesPassed = execResult.error === 0 ? 1 : 0;
                success = execResult.error === 0;
                results = [{
                    passed: success,
                    inputPreview: req.stdin,
                    output: execResult.output,
                    expected: '',
                    error: execResult.errorMessage || '',
                }];
            }

            const transformed = {
                success,
                testCasesPassed,
                totalTestCases,
                results,
                ...execResult
            };
            socket.emit('submission-result', transformed);
        } catch (err) {
            l.error('Error in submit-code:', err);
            socket.emit('submission-result', { error: 1, errorMessage: err.message || 'Code execution failed.' });
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
        l.info(`Server (HTTP + Socket.IO) started at port: ${PORT}`)
})
