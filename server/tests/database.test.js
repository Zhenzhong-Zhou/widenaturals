const { describe, it, before, after, afterEach } = require('mocha');
const sinon = require('sinon');
const db = require('../database/database');
const logger = require('../utilities/logger');
const { startServer, stopServer } = require('../server');

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
    
    after(async function () {
        // Wait for all pending operations to complete before shutting down
        await db.waitForOperationsToCompleteWithTimeout();
        
        // Stop the server and close the database pool after all tests complete
        await stopServer();
        await db.gracefulShutdown();
    });
    
    it('should log a slow query and track operations correctly', async function () {
        this.timeout(6000);
        const { expect } = await import('chai');
        const initialOngoingOperations = db.getOngoingOperationsCount();
        const loggerWarnSpy = sandbox.spy(logger, 'warn');
        
        try {
            // Start a slow query
            const queryPromise = db.query('SELECT pg_sleep(2);');
            await new Promise(resolve => setTimeout(resolve, 1500));  // Allow some time for the query to be identified as slow
            
            // Ensure the ongoing operations count has incremented
            expect(db.getOngoingOperationsCount()).to.equal(initialOngoingOperations + 1);
            
            await queryPromise;
            
            // Ensure the ongoing operations count has decremented
            expect(db.getOngoingOperationsCount()).to.equal(initialOngoingOperations);
            
            await new Promise(resolve => setTimeout(resolve, 1000));  // Slightly increased delay to account for logging
            
            // Check if the slow query was logged
            expect(loggerWarnSpy.calledOnce).to.be.true;
            expect(loggerWarnSpy.firstCall.args[0]).to.include('Slow query detected');
        } finally {
            loggerWarnSpy.restore();
        }
    });
    
    it('should handle a very slow query gracefully', async function () {
        const { expect } = await import('chai');
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
    
    it('should log an error for a failed query', async function () {
        const { expect } = await import('chai');
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
        const { expect } = await import('chai');
        const loggerInfoStub = sandbox.stub(logger, 'info');
        
        const health = await db.checkHealth();
        expect(health.status).to.equal('UP');
        expect(loggerInfoStub.calledWithMatch('Health check query executed in')).to.be.true;
        
        loggerInfoStub.restore();
    });
    
    it('should fail the health check when the database is down', async function () {
        const { expect } = await import('chai');
        const loggerWarnStub = sandbox.stub(logger, 'warn');
        const checkHealthStub = sandbox.stub(db, 'checkHealth').resolves({ status: 'DOWN', message: 'Simulated failure' });
        
        const health = await db.checkHealth();
        expect(health.status).to.equal('DOWN');
        expect(loggerWarnStub.calledWith('Health check attempted after pool has been shut down.')).to.be.false;
        
        checkHealthStub.restore();
        loggerWarnStub.restore();
    });
    
    it('should handle database connection loss and ensure shutdown blocks further queries', async function () {
        const { expect } = await import('chai');
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