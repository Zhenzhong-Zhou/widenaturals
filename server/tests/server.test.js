const assert = require('assert');
const { spawn } = require('child_process');
const path = require('path');
const request = require('supertest');
const Joi = require('celebrate').Joi;

describe('Server Initialization Tests', function() {
    let serverProcess;
    const serverScript = path.join(__dirname, '../server');
    
    before((done) => {
        process.env.PORT = 8080;
        process.env.NODE_ENV = 'test';
        
        // Start the server as a child process
        serverProcess = spawn('node', [serverScript], {
            env: process.env,
            stdio: ['pipe', 'pipe', 'pipe', 'ipc']
        });
        
        // Wait for the server to start
        serverProcess.stdout.on('data', (data) => {
            if (data.toString().includes('Server successfully started')) {
                done();
            }
        });
        
        serverProcess.stderr.on('data', (data) => {
            console.error(`Server error: ${data}`);
        });
    });
    
    after((done) => {
        if (serverProcess) {
            serverProcess.kill('SIGTERM');
            serverProcess.on('exit', done);
        } else {
            done();
        }
    });
    
    it('should validate environment variables successfully', (done) => {
        const envVarsSchema = Joi.object({
            NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
            PORT: Joi.number().default(3000),
        }).unknown().required();
        
        const { error } = envVarsSchema.validate(process.env);
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
        
        const { error } = envVarsSchema.validate(invalidEnv);
        assert.notStrictEqual(error, undefined);
        done();
    });
    
    it('should respond with 200 for the health check route', (done) => {
        request(`http://localhost:${process.env.PORT}`)
            .get('/api/v1/health')
            .expect(200, done);
    });
    
    it('should respond with 404 for an unknown route', (done) => {
        request(`http://localhost:${process.env.PORT}`)
            .get('/unknown-route')
            .expect(404, done);
    });
});