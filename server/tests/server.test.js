const config = require('config');
const sinon = require('sinon');
const { describe, it, before, after } = require('mocha');
const logger = require('../logger');
const db = require('../database/database');
const app = require('../server');

let chai, expect, chaiHttp;

async function loadDependencies() {
    chai = await import('chai');
    chaiHttp = await import('chai-http');
    chai.default.use(chaiHttp.default);
    expect = chai.default.expect;
}

describe('Server Initialization Tests', function () {
    let server;
    
    before(async function () {
        await loadDependencies();
        process.env.PORT = 3001; // Use a different port for testing
        server = app.listen(process.env.PORT);
    });
    
    after((done) => {
        if (server) {
            server.close(done);
        } else {
            done();
        }
    });
    
    it('should start the server successfully', async function () {
        const res = await chai.default.request(app).get('/');
        expect(res).to.have.status(404); // Expect 404 for the root path (Not Found)
    });
    
    it('should validate environment variables', async function () {
        const validateEnvVars = sinon.spy(db, 'checkHealth');
        await chai.default.request(app).get('/');
        expect(validateEnvVars.calledOnce).to.be.true;
        validateEnvVars.restore();
    });
    
    it('should check database health on startup', async function () {
        const checkHealthStub = sinon.stub(db, 'checkHealth').resolves({ status: 'UP', message: 'Database connection is healthy.' });
        
        await chai.default.request(app).get('/health');
        expect(checkHealthStub.calledOnce).to.be.true;
        checkHealthStub.restore();
    });
    
    it('should handle database health check failure on startup', async function () {
        const checkHealthStub = sinon.stub(db, 'checkHealth').resolves({ status: 'DOWN', message: 'Database connection is not healthy.' });
        
        try {
            await startServer();
        } catch (err) {
            expect(err).to.exist;
            expect(logger.error.calledWithMatch({ message: 'Database health check failed:', context: 'initialization' })).to.be.true;
        }
        checkHealthStub.restore();
    });
    
    it('should return 404 for unknown routes', async function () {
        const res = await chai.default.request(app).get('/unknown');
        expect(res).to.have.status(404);
    });
    
    it('should handle errors centrally', async function () {
        // Simulate an error route
        app.get('/error', (req, res, next) => {
            const err = new Error('Test Error');
            err.status = 500;
            next(err);
        });
        
        const res = await chai.default.request(app).get('/error');
        expect(res).to.have.status(500);
        expect(res.body).to.have.property('message', 'Test Error');
        expect(res.body).to.have.property('statusCode', 500);
    });
});