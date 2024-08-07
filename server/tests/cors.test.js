(async () => {
    const { expect } = (await import('chai')).default;
    const request = require('supertest');
    const app = require('../server'); // Adjust the path to your actual app file
    
    describe('CORS Configuration', () => {
        it('should allow requests from allowed origins', (done) => {
            request(app)
                .get('/api/v1/welcome')
                .set('Origin', 'http://localhost:3000') // Adjust to an allowed origin
                .end((err, res) => {
                    expect(res.status).to.not.equal(403);
                    done();
                });
        });
        
        it('should block requests from disallowed origins', (done) => {
            request(app)
                .get('/api/v1/welcome')
                .set('Origin', 'http://disallowed-origin.com') // Adjust to a disallowed origin
                .end((err, res) => {
                    expect(res.status).to.equal(403);
                    done();
                });
        });
    });
    
    run(); // This is necessary to start Mocha tests in async IIFE
})();