const { describe, it, before, after } = require('mocha');
const db = require('../database/database');
const { startServer, stopServer } = require('../server');

describe('Database Module Tests', function() {
    let server;
    
    before(async function() {
        process.env.PORT = 8081;
        server = await startServer(process.env.PORT);
    });
    
    after(async function() {
        await stopServer();
    });
    
    it('should log a slow query', async function() {
        const { expect } = await import('chai');
        try {
            const result = await db.query('SELECT pg_sleep(1);');
            expect(result).to.be.an('array');
        } catch (error) {
            throw new Error(`Slow query test failed: ${error.message}`);
        }
    });
    
    it('should log an error for a failed query', async function() {
        const { expect } = await import('chai');
        try {
            await db.query('SELECT * FROM non_existent_table;');
        } catch (error) {
            expect(error).to.be.an('error');
            expect(error.message).to.include('relation "non_existent_table" does not exist');
        }
    });
    
    it('should pass the health check', async function() {
        const { expect } = await import('chai');
        const health = await db.checkHealth();
        expect(health.status).to.equal('UP');
    });
    
    it('should fail the health check when the database is down', async function() {
        // Simulate a database down scenario
        const { expect } = await import('chai');
        const originalCheckHealth = db.checkHealth;
        db.checkHealth = async () => ({ status: 'DOWN', message: 'Simulated failure' });
        
        const health = await db.checkHealth();
        expect(health.status).to.equal('DOWN');
        
        // Restore the original method
        db.checkHealth = originalCheckHealth;
    });
});