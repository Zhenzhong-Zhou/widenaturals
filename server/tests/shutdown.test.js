const { describe, it, before, after } = require('mocha');
const { startServer, stopServer } = require('../server');
const path = require('path');
const { spawn } = require('child_process');

describe('Server Shutdown Tests', function() {
    let serverProcess;
    
    before((done) => {
        process.env.PORT = 8082;
        process.env.NODE_ENV = 'test';
        
        // Start the server as a child process
        serverProcess = spawn('node', [path.join(__dirname, '../server.js')], {
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
            serverProcess.on('exit', done);
            serverProcess.kill();
        } else {
            done();
        }
    });
    
    it('should shut down gracefully on SIGTERM', async function(done) {
        const { expect } = await import('chai');
        serverProcess.on('exit', (code, signal) => {
            expect(signal).to.equal('SIGTERM');
            done();
        });
        serverProcess.kill('SIGTERM');
    });
    
    it('should shut down gracefully on SIGINT', async function(done) {
        const { expect } = await import('chai');
        serverProcess.on('exit', (code, signal) => {
            expect(signal).to.equal('SIGINT');
            done();
        });
        serverProcess.kill('SIGINT');
    });
});