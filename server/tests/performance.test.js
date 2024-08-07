const request = require('supertest');
const { performance } = require('perf_hooks');
const assert = require('assert');
const app = require('../server');

describe('Performance Tests', function() {
    it('should respond within acceptable time for /api/v1/health', function(done) {
        const startTime = performance.now();
        request(app)
            .get('/api/v1/health')
            .end((err, res) => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                assert(duration < 200, `Response time exceeded: ${duration}ms`); // Example threshold
                done();
            });
    });
});