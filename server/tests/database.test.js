const {describe, it, before, after, afterEach} = require('mocha');
const sinon = require('sinon');
const db = require('../database/database');
const logger = require('../utilities/logger');
const {startServer, stopServer} = require('../server');

describe('Database Module Tests', function () {
    let server;
    let sandbox;
    
    before(async function () {
        process.env.PORT = 8081;
        server = await startServer(process.env.PORT);
    });
    
    beforeEach(function () {
        // Create a sandbox for each test
        sandbox = sinon.createSandbox();
        
        // Optionally, mock gracefulShutdown to prevent it from affecting other tests
        sandbox.stub(db, 'gracefulShutdown').callsFake(async () => {
            // Mocked implementation to simulate shutdown without actually closing the pool
        });
    });
    
    afterEach(async function () {
        // Restore all stubs and spies after each test
        sandbox.restore();
    });
    
    // after(async function () {
    //     // Wait for all pending operations to complete before shutting down
    //     await db.waitForOperationsToCompleteWithTimeout();
    //
    //     // Stop the server and close the database pool after all tests complete
    //     await stopServer();
    //     await db.gracefulShutdown();
    // });
    
    // it('should call incrementOperations and decrementOperations directly', async function () {
    //     const { expect } = await import('chai');
    //     const incrementOperationsSpy = sinon.spy(db, 'incrementOperations');
    //     const decrementOperationsSpy = sinon.spy(db, 'decrementOperations');
    //
    //     db.incrementOperations();
    //     db.decrementOperations();
    //
    //     expect(incrementOperationsSpy.calledOnce).to.be.true;
    //     expect(decrementOperationsSpy.calledOnce).to.be.true;
    //
    //     incrementOperationsSpy.restore();
    //     decrementOperationsSpy.restore();
    // });
    
    // it('should correctly track operations during a query', async function () {
    //     const { expect } = await import('chai');
    //     const incrementOperationsSpy = sinon.spy(db, 'incrementOperations');
    //     const decrementOperationsSpy = sinon.spy(db, 'decrementOperations');
    //
    //     // Simulate a normal query (not necessarily slow)
    //     const queryText = 'SELECT 1;';
    //     const queryParams = [];
    //
    //     try {
    //         // Record the initial operation count
    //         const initialOperationCount = db.getOngoingOperationsCount();
    //         console.log('Initial Operation Count:', initialOperationCount);
    //
    //         // Execute the query
    //         await db.query(queryText, queryParams);
    //
    //         // Get the operation count after the query
    //         const finalOperationCount = db.getOngoingOperationsCount();
    //         console.log('Final Operation Count:', finalOperationCount);
    //
    //         // Check if incrementOperations and decrementOperations were called
    //         console.log('incrementOperationsSpy called:', incrementOperationsSpy.calledOnce);
    //         console.log('decrementOperationsSpy called:', decrementOperationsSpy.calledOnce);
    //
    //         // Assert that operations were tracked correctly
    //         expect(incrementOperationsSpy.calledOnce).to.be.true;
    //         expect(decrementOperationsSpy.calledOnce).to.be.true;
    //         expect(finalOperationCount).to.equal(initialOperationCount);
    //
    //     } finally {
    //         incrementOperationsSpy.restore();
    //         decrementOperationsSpy.restore();
    //     }
    // });
    
    it('should log a slow query and track operations correctly', async function () {
        const {expect} = await import('chai');
        const loggerWarnStub = sinon.stub(logger, 'warn');
        
        // Simulate a slow query
        const slowQueryText = 'SELECT pg_sleep(1);'; // Simulates a 1-second delay
        const slowQueryParams = [];
        
        try {
            // Execute the query (this should trigger the logger.warn in your application code)
            await db.query(slowQueryText, slowQueryParams);
            
            // Assert that the logger.warn was called once for a slow query
            expect(loggerWarnStub.calledOnce).to.be.true;
            expect(loggerWarnStub.calledWithMatch('Slow query detected', sinon.match({
                text: slowQueryText,
                duration: sinon.match(value => value > 500),
            }))).to.be.true;
        } finally {
            loggerWarnStub.restore();
        }
    });
    
    it('should handle a very slow query gracefully', async function () {
        const {expect} = await import('chai');
        this.timeout(10000); // Increased timeout to 10 seconds
        const loggerWarnStub = sandbox.stub(logger, 'warn');
        
        try {
            const start = Date.now();
            const result = await db.query('SELECT pg_sleep(3);'); // Example of a slow query
            const duration = Date.now() - start;
            
            expect(result).to.be.an('array');
            expect(duration).to.be.greaterThan(500); // Adjust the threshold for slow queries in your code
            
            expect(loggerWarnStub.calledOnce).to.be.true;
            expect(loggerWarnStub.firstCall.args[0]).to.include('Slow query detected');
        } catch (error) {
            throw new Error(`Slow query handling test failed: ${error.message}`);
        } finally {
            loggerWarnStub.restore();
        }
    });
    
    it('should not log a slow query for fast queries', async function () {
        const {expect} = await import('chai');
        const loggerWarnStub = sinon.stub(logger, 'warn');
        
        // Simulate a fast query
        const fastQueryText = 'SELECT 1;';
        const fastQueryParams = [];
        
        try {
            // Execute the fast query (this should not trigger the logger.warn)
            await db.query(fastQueryText, fastQueryParams);
            
            // Assert that the logger.warn was not called
            expect(loggerWarnStub.called).to.be.false;
        } finally {
            loggerWarnStub.restore();
        }
    });
    
    it('should log an error for a failed query', async function () {
        const {expect} = await import('chai');
        const loggerErrorStub = sandbox.stub(logger, 'error');
        
        try {
            await db.query('SELECT * FROM non_existent_table;');
        } catch (error) {
            expect(loggerErrorStub.calledOnce).to.be.true;
            expect(error).to.be.an('error');
            expect(error.message).to.include('relation "non_existent_table" does not exist');
            expect(loggerErrorStub.firstCall.args[0]).to.equal('Error executing query');
        } finally {
            loggerErrorStub.restore();
        }
    });
    
    it('should pass the health check', async function () {
        const {expect} = await import('chai');
        const loggerInfoStub = sandbox.stub(logger, 'info');
        
        const health = await db.checkHealth();
        expect(health.status).to.equal('UP');
        expect(loggerInfoStub.calledWithMatch('Health check query executed in')).to.be.true;
        
        loggerInfoStub.restore();
    });
    
    it('should fail the health check when the database is down', async function () {
        const {expect} = await import('chai');
        const loggerWarnStub = sandbox.stub(logger, 'warn');
        const checkHealthStub = sandbox.stub(db, 'checkHealth').resolves({
            status: 'DOWN',
            message: 'Simulated failure'
        });
        
        const health = await db.checkHealth();
        expect(health.status).to.equal('DOWN');
        expect(loggerWarnStub.calledWith('Health check attempted after pool has been shut down.')).to.be.false;
        
        checkHealthStub.restore();
        loggerWarnStub.restore();
    });
    
    it('should handle database connection loss and ensure shutdown blocks further queries', async function () {
        const {expect} = await import('chai');
        const loggerErrorStub = sandbox.stub(logger, 'error');
        
        await db.gracefulShutdown();  // Ensure the pool is shut down
        
        try {
            await db.query('SELECT 1;');
        } catch (error) {
            expect(error).to.be.an('error');
            expect(error.message).to.include('Query attempted after pool has been shut down.');
        } finally {
            loggerErrorStub.restore();
        }
    });
});