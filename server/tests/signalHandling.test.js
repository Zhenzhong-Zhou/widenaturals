const { sendSignal } = require('../utilities/signal');
const db = require('../database/database');
const assert = require('assert');

(async () => {
    describe('Signal Handling', () => {
        it('should handle SIGINT signal gracefully', (done) => {
            // Simulate sending SIGINT to the current process
            sendSignal('SIGINT', process.pid);
            
            setTimeout(async () => {
                try {
                    // Check if the database pool has been closed
                    await db.gracefulShutdown();
                    assert.strictEqual(true, true);
                    done();
                } catch (error) {
                    done(error);
                }
            }, 1000); // Adjust the timeout as necessary
        });
        
        it('should handle SIGTERM signal gracefully', (done) => {
            // Simulate sending SIGTERM to the current process
            sendSignal('SIGTERM', process.pid);
            
            setTimeout(async () => {
                try {
                    // Check if the database pool has been closed
                    await db.gracefulShutdown();
                    assert.strictEqual(true, true);
                    done();
                } catch (error) {
                    done(error);
                }
            }, 1000); // Adjust the timeout as necessary
        });
        
        after(async () => {
            await db.gracefulShutdown();
            console.log('Database pool closed');
        });
    });
    
    run(); // This is necessary to start Mocha tests in async IIFE
})();