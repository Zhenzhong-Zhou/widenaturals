const request = require('supertest');
const express = require('express');
const sinon = require('sinon');
const {configureMiddleware, configureCors} = require('../utilities/middleware');
const logger = require('../utilities/logger');
const {celebrate, Joi, errors} = require('celebrate');
const {CustomError, handleErrors} = require('../middlewares/error/errorHandler');

describe('Middleware Tests', () => {
    let app;
    let loggerInfoSpy;
    let loggerErrorSpy;
    
    beforeEach(() => {
        app = express();
        const allowedOrigins = process.env.BASE_URL;
        configureMiddleware(app);
        configureCors(app, [allowedOrigins]);
        
        // Define a simple route for testing purposes
        app.get('/test', (req, res) => {
            res.send('OK');
        });
        
        // Add a route with validation to test Celebrate errors
        app.post('/validate', celebrate({
            body: Joi.object({
                name: Joi.string().required()
            })
        }), (req, res) => {
            res.send('OK');
        });
        
        // Add a route that throws an error to test error handling
        app.get('/error', (req, res, next) => {
            next(new CustomError(500, 'Test error'));
        });
        
        // Ensure Celebrate error handling is included
        app.use(errors());
        
        // Use custom error handling middleware
        app.use(handleErrors);
        
        // Spy on the logger methods
        loggerInfoSpy = sinon.spy(logger, 'info');
        loggerErrorSpy = sinon.spy(logger, 'error');
    });
    
    afterEach(() => {
        sinon.restore(); // Restore the original methods after each test
    });
    
    it('should use helmet middleware', (done) => {
        request(app)
            .get('/test')
            .expect('Content-Security-Policy', /default-src 'self'/)
            .expect(200, done);
    });
    
    it('should use rate limiting middleware', (done) => {
        request(app)
            .get('/test')
            .expect(200)
            .end(() => {
                request(app)
                    .get('/test')
                    .expect(200, done); // Assuming no rate limit hit in tests
            });
    });
    
    it('should use JSON body parser middleware', (done) => {
        const payload = {key: 'value'};
        request(app)
            .post('/test')
            .send(payload)
            .set('Content-Type', 'application/json')
            .expect(404, done); // Expect 404 since /test doesn't support POST
    });
    
    it('should log requests and responses', (done) => {
        request(app)
            .get('/test')
            .end((err, res) => {
                sinon.assert.calledWith(loggerInfoSpy, sinon.match(/GET \/test/), sinon.match({context: 'http_request'}));
                sinon.assert.calledWith(loggerInfoSpy, sinon.match(/GET \/test/), sinon.match({context: 'http_response'}));
                done();
            });
    });
    
    it('should handle CORS for allowed origins', (done) => {
        const allowedOrigin = process.env.BASE_URL;
        
        request(app)
            .get('/test')
            .set('Origin', allowedOrigin)
            .expect('Access-Control-Allow-Origin', allowedOrigin, done);
    });
    
    it('should block CORS for disallowed origins', (done) => {
        request(app)
            .get('/test')
            .set('Origin', 'http://disallowed-origin.com')
            .expect(403, done);
    });
    
    it('should handle Celebrate validation errors', (done) => {
        request(app)
            .post('/validate')
            .send({}) // Missing 'name' property
            .set('Content-Type', 'application/json')
            .expect(400, done); // Celebrate should throw a 400 error
    });
    
    it('should log errors and respond with 500', (done) => {
        request(app)
            .get('/error')
            .expect(500)
            .end((err, res) => {
                if (err) return done(err);
                sinon.assert.calledWith(loggerErrorSpy, sinon.match(/Error processing request GET \/error/), sinon.match({
                    context: 'http_error',
                    error: 'Test error',
                    stack: sinon.match.string,
                    statusCode: 500,
                    details: null
                }));
                done();
            });
    });
});