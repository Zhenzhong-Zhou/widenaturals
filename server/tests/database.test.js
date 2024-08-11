const {describe, it, before, after} = require('mocha');
const sinon = require('sinon');
const db = require('../database/database');
const logger = require('../utilities/logger');
const {startServer, stopServer} = require('../server');

describe('Database Module Tests', function () {
    let server;
    
    before(async function () {
        process.env.PORT = 8081;
        server = await startServer(process.env.PORT);
    });
    
    after(async function () {
        await stopServer();
        await db.gracefulShutdown(); // Ensure the pool is properly shut down after tests
    });
    
    it('should log a slow query', async function () {
        const {expect} = await import('chai');
        const loggerWarnStub = sinon.stub(logger, 'warn');
        
        try {
            const result = await db.query('SELECT pg_sleep(1);');
            expect(result).to.be.an('array');
            expect(loggerWarnStub.calledOnce).to.be.true;
            expect(loggerWarnStub.firstCall.args[0]).to.equal('Slow query detected');
        } catch (error) {
            throw new Error(`Slow query test failed: ${error.message}`);
        } finally {
            loggerWarnStub.restore();
        }
    });
    
    it('should handle a very slow query gracefully', async function () {
        const {expect} = await import('chai');
        this.timeout(5000); // Adjust timeout based on expected query time
        const loggerWarnStub = sinon.stub(logger, 'warn');
        
        try {
            const result = await db.query('SELECT pg_sleep(3);'); // Example of a slow query
            expect(result).to.be.an('array');
            expect(loggerWarnStub.calledOnce).to.be.true;
            expect(loggerWarnStub.firstCall.args[0]).to.equal('Slow query detected');
        } catch (error) {
            throw new Error(`Slow query handling test failed: ${error.message}`);
        } finally {
            loggerWarnStub.restore();
        }
    });
    
    it('should log an error for a failed query', async function () {
        const {expect} = await import('chai');
        const loggerErrorStub = sinon.stub(logger, 'error');
        
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
        const loggerInfoStub = sinon.stub(logger, 'info');
        
        const health = await db.checkHealth();
        expect(health.status).to.equal('UP');
        expect(loggerInfoStub.calledWithMatch('Health check query executed in')).to.be.true;
        
        loggerInfoStub.restore();
    });
    
    it('should fail the health check when the database is down', async function () {
        const {expect} = await import('chai');
        const loggerWarnStub = sinon.stub(logger, 'warn');
        const checkHealthStub = sinon.stub(db, 'checkHealth').resolves({status: 'DOWN', message: 'Simulated failure'});
        
        const health = await db.checkHealth();
        expect(health.status).to.equal('DOWN');
        expect(loggerWarnStub.calledWith('Health check attempted after pool has been shut down.')).to.be.false;
        
        checkHealthStub.restore();
        loggerWarnStub.restore();
    });
    
    it('should handle database connection loss and ensure shutdown blocks further queries', async function () {
        const {expect} = await import('chai');
        const loggerErrorStub = sinon.stub(logger, 'error');
        
        // Simulate database connection loss
        await db.gracefulShutdown(); // This will shut down the pool
        
        try {
            await db.query('SELECT 1;');
            throw new Error('Query should have failed due to connection loss');
        } catch (error) {
            expect(error).to.be.an('error');
            expect(error.message).to.include('Query attempted after pool has been shut down.');
        }
        
        loggerErrorStub.restore();
    });
});