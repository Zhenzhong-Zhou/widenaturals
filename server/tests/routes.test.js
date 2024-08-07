(async () => {
    const { expect } = (await import('chai')).default;
    const request = require('supertest');
    const app = require('../server'); // Adjust the path to your actual app file
    
    describe('Route Handling', () => {
        it('should handle GET requests to /api/v1/welcome', (done) => {
            request(app)
                .get('/api/v1/welcome')
                .end((err, res) => {
                    expect(res.status).to.equal(200);
                    expect(res.body).to.have.property('message'); // Adjust based on your actual response
                    done();
                });
        });
    });
    
    run(); // This is necessary to start Mocha tests in async IIFE
})();