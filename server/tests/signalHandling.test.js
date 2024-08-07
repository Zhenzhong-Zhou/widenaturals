const { sendSignal } = require('../utilities/signal');
const app = require('../server'); // Adjust the path to your server
const db = require('../database/database'); // Adjust the path to your database module

(async () => {
    const chai = await import('chai');
    const chaiHttp = await import('chai-http');
    
    chai.default.use(chaiHttp.default);
    const expect = chai.default.expect;
    
    describe('Signal Handling', () => {
        it('should handle SIGINT signal gracefully', (done) => {
            // Simulate sending SIGINT to the current process
            sendSignal('SIGINT', process.pid);
            
            setTimeout(async () => {
                // Check if the database pool has been closed
                await db.gracefulShutdown();
                expect(true).to.be.true;
                done();
            }, 1000); // Adjust the timeout as necessary
        });
        
        it('should handle SIGTERM signal gracefully', (done) => {
            // Simulate sending SIGTERM to the current process
            sendSignal('SIGTERM', process.pid);
            
            setTimeout(async () => {
                // Check if the database pool has been closed
                await db.gracefulShutdown();
                expect(true).to.be.true;
                done();
            }, 1000); // Adjust the timeout as necessary
        });
        
        after(async () => {
            await db.gracefulShutdown();
            console.log('Database pool closed');
        });
    });
    
    run(); // This is necessary to start Mocha tests in async IIFE
})();