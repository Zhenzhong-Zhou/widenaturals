(async () => {
    const { expect } = (await import('chai')).default;
    const request = require('supertest');
    const app = require('../server'); // Adjust the path to your actual app file
    
    describe('Server Initialization Tests', () => {
        it('should respond to a basic route', (done) => {
            request(app)
                .get('/')
                .end((err, res) => {
                    expect(res.status).to.equal(404);
                    done();
                });
        });
        
        it('should handle 404 errors', (done) => {
            request(app)
                .get('/non-existent-route')
                .end((err, res) => {
                    expect(res.status).to.equal(404);
                    expect(res.body).to.have.property('message', 'Not Found');
                    done();
                });
        });
    });
    
    run(); // This is necessary to start Mocha tests in async IIFE
})();