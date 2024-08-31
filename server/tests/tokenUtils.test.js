const sinon = require('sinon');
const {v4: uuidv4} = require('uuid');
const jwt = require('jsonwebtoken');
const tokenUtils = require('../utilities/auth/tokenUtils');
const idUtils = require('../utilities/idUtils');
const logger = require('../utilities/logger');
const database = require('../database/database');

describe('generateToken', () => {
    let expect;
    let sandbox;
    let salt, employeeHashData, roleHashData, token, hashedToken, tokenId;
    
    before(async () => {
        const chai = await import('chai');
        expect = chai.expect;
    });
    
    beforeEach(() => {
        // Create a new sandbox for each test
        sandbox = sinon.createSandbox();
        
        // Define the common variables
        salt = 'somesalt';
        employeeHashData = {originalID: '9b4057e6-e715-47c4-8b0a-08582914bcd3', hashedID: 'hashedEmployeeId'};
        roleHashData = {originalID: 'ecf25233-86dd-4d4d-b2ce-54b723b1082f', hashedID: 'hashedRoleId'};
        token = 'jwtToken';
        hashedToken = 'hashedJwtToken';
        tokenId = 'uuidTokenId';
        
        // Stub methods with the sandbox
        sandbox.stub(idUtils, 'generateSalt').returns(salt);
        sandbox.stub(idUtils, 'processID')
            .onFirstCall().returns(employeeHashData)
            .onSecondCall().returns(roleHashData);
        sandbox.stub(jwt, 'sign').returns(token);
        
        // Ensure hashID is only stubbed once
        if (!idUtils.hashID.restore) {
            sandbox.stub(idUtils, 'hashID').returns(hashedToken);
        }
        sandbox.stub(tokenUtils, 'storeRefreshToken').resolves(tokenId);
        sandbox.stub(logger, 'info');
        sandbox.stub(logger, 'error');
        sandbox.stub(database, 'query').resolves([]);
        sandbox.stub(database, 'gracefulShutdown').callsFake(async () => {
        });
    });
    
    afterEach(() => {
        // Restore all stubs after each test
        sandbox.restore();
    });
    
    after(async () => {
        await database.waitForOperationsToCompleteWithTimeout();
    });
    
    it('should generate an access token with hashed employee and role IDs', async function () {
        this.timeout(10000);
        
        const employee = {
            id: '9b4057e6-e715-47c4-8b0a-08582914bcd3',
            role_id: 'ecf25233-86dd-4d4d-b2ce-54b723b1082f'
        };
        
        // No need to stub hashID again if it’s already done in beforeEach
        
        try {
            const result = await tokenUtils.generateToken(employee, 'access');
            
            // Check the result
            expect(result).to.equal(hashedToken);
            expect(idUtils.generateSalt.calledOnce).to.be.true;
            expect(idUtils.processID.calledTwice).to.be.true;
            expect(logger.info.calledOnceWith(`Token generated for employee ${employee.id} (access token)`)).to.be.true;
        } catch (error) {
            logger.error('Error in test execution:', error);
            throw error;
        }
    });
    
    it('should generate a refresh token and store it with hashed employee and role IDs', async function () {
        this.timeout(10000);
        const employee = {
            id: '9b4057e6-e715-47c4-8b0a-08582914bcd3',
            role_id: 'ecf25233-86dd-4d4d-b2ce-54b723b1082f'
        };
        
        const result = await tokenUtils.generateToken(employee, 'refresh');
        expect(result).to.equal(hashedToken);
        expect(tokenUtils.storeRefreshToken.calledOnceWith(employee.id, hashedToken, sinon.match.date)).to.be.true;
        expect(idUtils.generateSalt.calledOnce).to.be.true;
        expect(idUtils.processID.calledTwice).to.be.true;
        expect(logger.info.calledOnceWith(`Token generated for employee ${employee.id} (refresh token)`)).to.be.true;
    });
    
    it('should throw an error if an invalid token type is provided', async () => {
        const employee = {
            id: '9b4057e6-e715-47c4-8b0a-08582914bcd3',
            role_id: 'ecf25233-86dd-4d4d-b2ce-54b723b1082f'
        };
        const invalidType = 'invalidType';
        
        try {
            await tokenUtils.generateToken(employee, invalidType);
            expect.fail('Expected error was not thrown');
        } catch (error) {
            expect(error.message).to.equal('Invalid token type');
        }
    });
    
    it('should log an error and throw an error if token generation fails', async () => {
        const employee = {
            id: '9b4057e6-e715-47c4-8b0a-08582914bcd3',
            role_id: 'ecf25233-86dd-4d4d-b2ce-54b723b1082f'
        };
        const errorMessage = 'Token generation error';
        
        sandbox.stub(idUtils, 'processID').throws(new Error(errorMessage));
        
        try {
            await tokenUtils.generateToken(employee, 'access');
            expect.fail('Expected error was not thrown');
        } catch (error) {
            expect(error.message).to.equal('Token generation failed');
            expect(logger.error.calledOnceWith('Error generating token:', sinon.match.instanceOf(Error))).to.be.true;
        }
    });
});

// Global after hook in test setup (e.g., testSetup.js)
after(async () => {
    logger.info('Waiting for all operations to complete before shutting down the pool...');
    
    // Wait for all operations to complete before shutting down
    await database.waitForOperationsToCompleteWithTimeout();
    
    logger.info('Shutting down the pool...');
    await database.gracefulShutdown();
    logger.info('Pool has been shut down.');
});
