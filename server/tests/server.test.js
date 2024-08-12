const assert = require('assert');
const {spawn} = require('child_process');
const path = require('path');
const request = require('supertest');
const Joi = require('celebrate').Joi;

describe('Server Initialization Tests', function () {
    let serverProcess;
    const serverScript = path.join(__dirname, '../server');
    
    this.timeout(20000); // Increase the timeout to 20 seconds
    
    before((done) => {
        process.env.PORT = 8080;
        process.env.NODE_ENV = 'test';
        
        let doneCalled = false; // Flag to track if done has been called
        
        const handleDone = (err) => {
            if (!doneCalled) {
                doneCalled = true;
                done(err);
            }
        };
        
        // Start the server as a child process
        serverProcess = spawn('node', [serverScript], {
            env: process.env,
            stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        });
        
        console.log('Attempting to start the server...');
        
        // Wait for the server to start
        serverProcess.stdout.on('data', (data) => {
            console.log(`Server stdout: ${data}`);
            if (data.toString().includes('Server started successfully')) {
                // Add a short delay or further checks if necessary
                setTimeout(() => handleDone(), 1000); // Wait 1 second after server start
            }
        });
        
        serverProcess.stderr.on('data', (data) => {
            console.error(`Server error: ${data}`);
            handleDone(new Error(data.toString())); // Call done with error
        });
        
        serverProcess.on('error', (err) => {
            console.error(`Failed to start server: ${err}`);
            handleDone(err); // Call done with error
        });
        
        serverProcess.on('exit', (code) => {
            if (code !== 0) {
                console.error(`Server process exited with code ${code}`);
                handleDone(new Error(`Server process exited with code ${code}`)); // Call done with error
            } else {
                console.log(`Server process exited with code ${code}`);
            }
        });
    });
    
    after((done) => {
        if (serverProcess) {
            serverProcess.kill('SIGTERM');
            serverProcess.on('exit', () => {
                done();
            });
        } else {
            done();
        }
    });
    
    it('should validate environment variables successfully', (done) => {
        const envVarsSchema = Joi.object({
            NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
            PORT: Joi.number().default(3000),
        }).unknown().required();
        
        const {error} = envVarsSchema.validate(process.env);
        assert.strictEqual(error, undefined);
        done();
    });
    
    it('should handle invalid environment variables', (done) => {
        const invalidEnv = {
            NODE_ENV: 'invalid',
            PORT: 'invalid',
        };
        
        const envVarsSchema = Joi.object({
            NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
            PORT: Joi.number().default(3000),
        }).unknown().required();
        
        const {error} = envVarsSchema.validate(invalidEnv);
        assert.notStrictEqual(error, undefined);
        done();
    });
    
    it('should respond with 200 for the health check route', (done) => {
        request(`http://localhost:${process.env.PORT}`)
            .get('/api/v1/health')
            .expect(200)
            .expect((res) => {
                assert(res.body.status === 'UP', 'Health status is UP');
            })
            .end(done);
    });
    
    it('should respond with 404 for an unknown route', (done) => {
        request(`http://localhost:${process.env.PORT}`)
            .get('/unknown-route')
            .expect(404, done);
    });
});