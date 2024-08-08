const { describe, it, before, after } = require('mocha');
const { spawn } = require('child_process');
const path = require('path');

describe('Server Shutdown Tests', function() {
    let serverProcess;
    
    this.timeout(60000); // Increase the timeout to 60 seconds
    
    before((done) => {
        process.env.PORT = 8082;
        process.env.NODE_ENV = 'test';
        
        // Start the server as a child process
        serverProcess = spawn('node', [path.join(__dirname, '../server.js')], {
            env: process.env,
            stdio: ['pipe', 'pipe', 'pipe', 'ipc']
        });
        
        // Wait for the server to start
        const onDataHandler = (data) => {
            console.log(`Server stdout: ${data}`);
            if (data.toString().includes('Server successfully started')) {
                serverProcess.stdout.off('data', onDataHandler);
                done();
            }
        };
        
        serverProcess.stdout.on('data', onDataHandler);
        
        serverProcess.stderr.on('data', (data) => {
            console.error(`Server error: ${data}`);
        });
        
        serverProcess.on('error', (err) => {
            console.error(`Failed to start server: ${err}`);
            done(err);
        });
    });
    
    after((done) => {
        if (serverProcess) {
            serverProcess.on('exit', () => {
                done();
            });
            serverProcess.kill('SIGTERM'); // Ensuring we gracefully shutdown after tests
        } else {
            done();
        }
    });
    
    it('should shut down gracefully on SIGTERM', async function() {
        const { expect } = await import('chai');
        return new Promise((resolve, reject) => {
            const onExitHandler = (code, signal) => {
                try {
                    expect(signal).to.equal('SIGTERM');
                    serverProcess.off('exit', onExitHandler);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            serverProcess.on('exit', onExitHandler);
            serverProcess.kill('SIGTERM');
        });
    });
    
    it('should shut down gracefully on SIGINT', async function() {
        const { expect } = await import('chai');
        return new Promise((resolve, reject) => {
            const onExitHandler = (code, signal) => {
                try {
                    expect(signal).to.equal('SIGINT');
                    serverProcess.off('exit', onExitHandler);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            serverProcess.on('exit', onExitHandler);
            serverProcess.kill('SIGINT');
        });
    });
});