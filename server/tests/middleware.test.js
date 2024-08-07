(async () => {
    const { expect } = (await import('chai')).default;
    const request = require('supertest');
    const app = require('../server'); // Adjust the path to your actual app file
    
    describe('Middleware Functionality', () => {
        it('should apply security headers with helmet', (done) => {
            request(app)
                .get('/api/v1/welcomesd')
                .end((err, res) => {
                    expect(res.headers).to.have.property('x-dns-prefetch-control', 'off');
                    expect(res.headers).to.have.property('x-frame-options', 'DENY');
                    expect(res.headers).to.have.property('x-download-options', 'noopen');
                    expect(res.headers).to.have.property('x-content-type-options', 'nosniff');
                    expect(res.headers).to.have.property('x-permitted-cross-domain-policies', 'none');
                    done();
                });
        });
        
        it('should limit rate of requests', function (done) {
            this.timeout(20000); // Extend timeout due to multiple requests
            const requests = Array.from({ length: 101 }, () =>
                request(app).get('/api/v1/welcome')
            );
            
            Promise.all(requests)
                .then((responses) => {
                    const lastResponse = responses[responses.length - 1];
                    expect(lastResponse.status).to.equal(429); // Ensure the last response is rate limited
                    expect(lastResponse.text).to.include('Too many requests from this IP, please try again later.');
                    done();
                })
                .catch(done);
        });
    });
    
    run(); // This is necessary to start Mocha tests in async IIFE
})();