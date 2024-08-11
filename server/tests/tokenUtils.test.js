const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const { generateToken, validateToken, revokeToken, validateStoredRefreshToken, refreshTokens } = require('../utilities/auth/tokenUtils');
const { query } = require('../database/database');
const { processID, storeInIdHashMap, hashID, generateSalt } = require('../utilities/idUtils');

// Use dynamic import for chai and chai-as-promised
let chai, chaiAsPromised, expect;

before(async () => {
    chai = await import('chai');
    chaiAsPromised = await import('chai-as-promised');
    chai.use(chaiAsPromised.default);
    expect = chai.expect;
});

describe('Token Utilities', () => {
    let sandbox;
    let employee;
    
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        employee = { id: '123', role_id: '456' }; // Sample employee data
    });
    
    afterEach(() => {
        sandbox.restore();
    });
    
    describe('generateToken', () => {
        it('should generate an access token and store hashed IDs', async () => {
            // Ensure stubs return correct values
            const processIDStub = sandbox.stub(require('../utilities/idUtils'), 'processID').returns({ hashedID: 'hashedEmployeeId', salt: 'salt' });
            const storeInIdHashMapStub = sandbox.stub(require('../utilities/idUtils'), 'storeInIdHashMap').resolves();
            const jwtSignStub = sandbox.stub(jwt, 'sign').returns('jwtToken');
            const hashIDStub = sandbox.stub(require('../utilities/idUtils'), 'hashID').returns('hashedToken');
            
            const token = await generateToken(employee, 'access');
            expect(token).to.equal('hashedToken');
            expect(processIDStub.calledTwice).to.be.true;
            expect(storeInIdHashMapStub.calledTwice).to.be.true;
            expect(jwtSignStub.calledOnce).to.be.true;
            expect(hashIDStub.calledOnce).to.be.true;
        });
        
        it('should throw an error if an invalid token type is provided', async () => {
            // Ensure the correct error is thrown
            await expect(generateToken(employee, 'invalidType')).to.be.rejectedWith('Invalid token type');
        });
    });
    
    describe('validateToken', () => {
        it('should validate a valid token', () => {
            const token = 'validToken';
            const secret = 'secret';
            sandbox.stub(jwt, 'verify').returns({ sub: 'hashedEmployeeId' });
            
            const decoded = validateToken(token, secret);
            expect(decoded).to.deep.equal({ sub: 'hashedEmployeeId' });
        });
        
        it('should return null for an invalid token', () => {
            const token = 'invalidToken';
            const secret = 'secret';
            sandbox.stub(jwt, 'verify').throws(new Error('Invalid token'));
            
            const decoded = validateToken(token, secret);
            expect(decoded).to.be.null;
        });
    });
    
    describe('revokeToken', () => {
        it('should revoke a valid refresh token', async () => {
            const token = 'validToken';
            const salt = 'salt';
            
            // Ensure stubs return correct values
            sandbox.stub(require('../utilities/idUtils'), 'hashID').returns('hashedToken');
            const queryStub = sandbox.stub(query).resolves(); // Make sure `query` is a function
            
            await expect(revokeToken(token, salt)).to.be.fulfilled;
            expect(queryStub.calledOnce).to.be.true;
        });
        
        it('should throw an error if the query fails', async () => {
            const token = 'validToken';
            const salt = 'salt';
            
            sandbox.stub(require('../utilities/idUtils'), 'hashID').returns('hashedToken');
            const queryStub = sandbox.stub(query).rejects(new Error('Query failed')); // Make sure `query` is a function
            
            await expect(revokeToken(token, salt)).to.be.rejectedWith('Failed to revoke token');
            expect(queryStub.calledOnce).to.be.true;
        });
    });
    
    describe('validateStoredRefreshToken', () => {
        it('should validate a stored refresh token', async () => {
            const refreshToken = 'validRefreshToken';
            sandbox.stub(query).onFirstCall().resolves([{ salt: 'salt' }]);
            sandbox.stub(query).onSecondCall().resolves([{ id: '123' }]);
            sandbox.stub(require('../utilities/idUtils'), 'hashID').returns('hashedToken');
            
            const result = await validateStoredRefreshToken(refreshToken);
            expect(result).to.deep.equal({ id: '123' });
        });
        
        it('should return null if no salt is found', async () => {
            const refreshToken = 'invalidRefreshToken';
            sandbox.stub(query).resolves([]);
            
            const result = await validateStoredRefreshToken(refreshToken);
            expect(result).to.be.null;
        });
        
        it('should throw an error if token validation fails', async () => {
            const refreshToken = 'validRefreshToken';
            sandbox.stub(query).onFirstCall().resolves([{ salt: 'salt' }]);
            sandbox.stub(query).onSecondCall().rejects(new Error('Query failed'));
            
            await expect(validateStoredRefreshToken(refreshToken)).to.be.rejectedWith('Failed to validate stored refresh token');
        });
    });
    
    describe('refreshTokens', () => {
        it('should refresh access and refresh tokens', async () => {
            const refreshToken = 'validRefreshToken';
            sandbox.stub(require('../utilities/auth/tokenUtils'), 'validateStoredRefreshToken').resolves({ employee_id: '123' });
            sandbox.stub(require('../utilities/auth/tokenUtils'), 'generateToken').onFirstCall().resolves('newAccessToken').onSecondCall().resolves('newRefreshToken');
            
            const result = await refreshTokens(refreshToken);
            expect(result).to.deep.equal({ accessToken: 'newAccessToken', refreshToken: 'newRefreshToken' });
        });
        
        it('should throw an error for invalid or revoked refresh token', async () => {
            const refreshToken = 'invalidRefreshToken';
            sandbox.stub(require('../utilities/auth/tokenUtils'), 'validateStoredRefreshToken').resolves(null);
            
            await expect(refreshTokens(refreshToken)).to.be.rejectedWith('Invalid or revoked refresh token');
        });
    });
});
