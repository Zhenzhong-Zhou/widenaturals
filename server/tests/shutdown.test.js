const { describe, it, beforeEach, afterEach } = require('mocha');
const { spawn } = require('child_process');
const path = require('path');

describe('Server Shutdown Tests', function() {
    let serverProcess;
    
    this.timeout(10000); // Increase timeout to 10 seconds
    
    beforeEach(function() {
        this.timeout(10000); // Increase timeout to 10 seconds
        process.env.PORT = 8082;
        process.env.NODE_ENV = 'test';
        
        return new Promise((resolve, reject) => {
            serverProcess = spawn('node', [path.join(__dirname, '../server.js')], {
                env: process.env,
                stdio: ['pipe', 'pipe', 'pipe', 'ipc']
            });
            
            const onDataHandler = (data) => {
                const output = data.toString();
                console.log(`Server stdout: ${output}`);
                if (output.includes('Server successfully started')) {
                    serverProcess.stdout.off('data', onDataHandler); // Stop listening to avoid multiple done() calls
                    resolve();
                }
            };
            
            serverProcess.stdout.on('data', onDataHandler);
            
            serverProcess.stderr.on('data', (data) => {
                console.error(`Server error: ${data}`);
                reject(new Error(`Server failed to start: ${data.toString()}`));
            });
            
            serverProcess.on('error', (err) => {
                console.error(`Failed to start server: ${err}`);
                reject(err);
            });
            
            serverProcess.on('exit', (code, signal) => {
                reject(new Error(`Server exited prematurely with code ${code} and signal ${signal}`));
            });
        });
    });
    
    afterEach(function() {
        this.timeout(10000); // Increase timeout for afterEach to 10 seconds
        
        return new Promise((resolve, reject) => {
            if (serverProcess && serverProcess.exitCode === null) { // Check if the process is still running
                console.log('Attempting to kill server process in afterEach...');
                
                const cleanup = () => {
                    console.log('Cleaning up event listeners.');
                    serverProcess.removeAllListeners('exit'); // Remove any listeners to prevent memory leaks
                };
                
                serverProcess.once('exit', (code, signal) => {
                    console.log(`Process exited in afterEach with code: ${code}, signal: ${signal}`);
                    cleanup();
                    resolve();
                });
                
                serverProcess.kill('SIGTERM'); // Send SIGTERM to initiate graceful shutdown
                
                // Adding a timeout to force resolve if the process doesn't exit as expected
                setTimeout(() => {
                    console.log('Forcefully resolving afterEach after timeout...');
                    cleanup();
                    resolve();
                }, 9000); // Just under the 10s timeout to ensure resolve is called
            } else {
                console.log('No server process found to kill in afterEach.');
                resolve();
            }
        });
    });
    
    it('should shut down gracefully on SIGTERM', async function() {
        const { expect } = await import('chai');
        return new Promise((resolve, reject) => {
            serverProcess.once('exit', (code, signal) => {
                console.log(`Process exited with code: ${code}, signal: ${signal}`);
                
                try {
                    if (signal === null) {
                        console.log('Process exited cleanly without a signal.');
                    }
                    expect(signal).to.be.oneOf(['SIGTERM', null]); // Allow `null` if process exits normally
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
            
            console.log('Sending SIGTERM to process');
            serverProcess.kill('SIGTERM');
        });
    });
    
    it('should shut down gracefully on SIGINT', async function() {
        const { expect } = await import('chai');
        return new Promise((resolve, reject) => {
            serverProcess.once('exit', (code, signal) => {
                console.log(`Process exited with code: ${code}, signal: ${signal}`);
                try {
                    expect(signal).to.be.oneOf(['SIGINT', null]);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
            console.log('Sending SIGINT to process');
            serverProcess.kill('SIGINT');
        });
    });
});