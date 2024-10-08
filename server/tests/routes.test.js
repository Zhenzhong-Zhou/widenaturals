const request = require('supertest');
const assert = require('assert');
const sinon = require('sinon');
const {app} = require('../server');
const db = require('../database/database'); // Adjust the path as needed

describe('Routes Tests', function () {
    
    // Setup the mock before the tests
    before(function () {
        sinon.stub(db, 'checkHealth').returns(Promise.resolve({status: 'UP'}));
    });
    
    // Restore the original function after the tests
    after(function () {
        db.checkHealth.restore();
    });
    
    it('should return 404 for an unknown route', function (done) {
        request(app)
            .get('/unknown-route')
            .end((err, res) => {
                assert.strictEqual(res.status, 404);
                assert.strictEqual(res.body.statusCode, 404);
                assert.strictEqual(res.body.message, 'Not Found');
                done();
            });
    });
    
    it('should return 200 for the health check route', function (done) {
        request(app)
            .get('/api/v1/health')
            .end((err, res) => {
                if (err) {
                    console.error('Request failed:', err);
                    return done(err);
                }
                console.log('Status:', res.status);
                console.log('Response Body:', res.body);
                try {
                    assert.strictEqual(res.status, 200);
                    assert.strictEqual(res.body.status, 'UP');
                    done();
                } catch (error) {
                    console.error('Assertion failed:', error);
                    done(error);
                }
            });
    });
    
    it('should return 200 for the welcome route', function (done) {
        request(app)
            .get('/api/v1/welcome')
            .end((err, res) => {
                console.log('Status:', res.status);
                console.log('Response Body:', res.body);
                console.log('Response Text:', res.text);
                assert.strictEqual(res.status, 200);
                assert.strictEqual(res.text, 'Welcome to use the server of WIDE Naturals INC. Enterprise Resource Planning.');
                done();
            });
    });
});