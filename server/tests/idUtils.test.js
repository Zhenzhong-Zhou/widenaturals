const sinon = require('sinon');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');  // Import the uuid library
const database = require('../database/database');
const idUtils = require('../utilities/idUtils');
const logger = require('../utilities/logger');

describe('idUtils Tests', () => {
    let expect;
    let sandbox;
    
    before(async () => {
        const chai = await import('chai');
        expect = chai.expect;
    });
    
    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });
    
    afterEach(() => {
        sandbox.restore();
    });
    
    describe('generateSalt', () => {
        it('should generate a salt of the specified length', () => {
            const length = 12;  // Use the specified salt length
            const salt = idUtils.generateSalt(length);
            expect(salt).to.be.a('string');
            expect(salt.length).to.equal(length * 2); // Hex encoding doubles the length
        });
    });
    
    describe('hashID', () => {
        it('should hash an ID using the specified salt and algorithm', () => {
            const id = uuidv4();  // Generate a UUID dynamically
            const salt = 'test-salt';
            const hashedID = idUtils.hashID(id, salt, 'sha256');
            const expectedHash = crypto.createHash('sha256').update(id + salt).digest('hex');
            expect(hashedID).to.equal(expectedHash);
        });
    });
    
    describe('maskID', () => {
        it('should mask an ID by hiding all but the last 4 characters', () => {
            const id = '1234567890';
            const maskedID = idUtils.maskID(id);
            expect(maskedID).to.equal('******7890');
        });
    });
    
    describe('processID', () => {
        it('should process an ID by validating, hashing, and masking it', () => {
            const id = uuidv4();  // Generate a UUID dynamically
            const result = idUtils.processID(id);
            
            expect(result).to.have.property('originalID', id);
            expect(result).to.have.property('hashedID').that.is.a('string');
            expect(result).to.have.property('maskedID').that.matches(/^\*+[a-zA-Z0-9]{4}$/);
            expect(result).to.have.property('salt').that.is.a('string');
            expect(result).to.have.property('version', 1);
        });
        
        it('should throw an error for an invalid ID', () => {
            expect(() => idUtils.processID('')).to.throw('Invalid ID: ID must be a non-empty string.');
        });
    });
    
    describe('processMultipleIDs', () => {
        it('should process multiple IDs', () => {
            const ids = [uuidv4(), uuidv4()];  // Generate multiple UUIDs dynamically
            const results = idUtils.processMultipleIDs(ids);
            expect(results).to.be.an('array').with.length(2);
            results.forEach(result => {
                expect(result).to.have.property('originalID').that.is.a('string');
                expect(result).to.have.property('hashedID').that.is.a('string');
                expect(result).to.have.property('maskedID').that.matches(/^\*+[a-zA-Z0-9]{4}$/); // Updated regex to match the expected masked ID format
            });
        });
    });
    
    describe('storeInIdHashMap', () => {
        it('should store a hashed ID in the id_hash_map table', async () => {
            const originalID = uuidv4();  // Generate a UUID dynamically
            const hashedID = 'hashed-id';
            const tableName = 'test-table';
            const salt = 'test-salt';
            
            const queryStub = sandbox.stub(database, 'query');
            queryStub.onFirstCall().resolves([]);  // Simulate no existing entry
            
            const loggerStub = sandbox.stub(logger, 'info');
            
            await idUtils.storeInIdHashMap({ originalID, hashedID, tableName, salt });
            
            expect(queryStub.calledOnce).to.be.true;
            expect(queryStub.firstCall.args[0]).to.include('INSERT INTO id_hash_map');
            expect(loggerStub.calledWith('Successfully stored hashed ID in id_hash_map')).to.be.true;
        });
        
        it('should skip insertion if the entry already exists', async () => {
            const originalID = uuidv4();  // Generate a UUID dynamically
            const hashedID = 'hashed-id';
            const tableName = 'test-table';
            const salt = 'test-salt';
            
            const queryStub = sandbox.stub(database, 'query');
            queryStub.onFirstCall().resolves([{ original_id: originalID }]);  // Simulate an existing entry
            
            const loggerStub = sandbox.stub(logger, 'info');
            
            await idUtils.storeInIdHashMap({ originalID, hashedID, tableName, salt });
            
            expect(queryStub.calledOnce).to.be.true;
            expect(loggerStub.calledWith('Entry already exists in id_hash_map, skipping insertion')).to.be.true;
        });
        
        it('should handle duplicate key violation gracefully', async () => {
            const originalID = uuidv4();  // Generate a UUID dynamically
            const hashedID = 'hashed-id';
            const tableName = 'test-table';
            const salt = 'test-salt';
            
            const queryStub = sandbox.stub(database, 'query');
            queryStub.onFirstCall().resolves([]);  // Simulate no existing entry
            queryStub.onSecondCall().throws(new Error('duplicate key value violates unique constraint "id_hash_map_hashed_id_unique"'));
            
            const loggerStub = sandbox.stub(logger, 'warn');
            
            await idUtils.storeInIdHashMap({ originalID, hashedID, tableName, salt });
            
            expect(loggerStub.calledWith('Duplicate entry detected, skipping insertion')).to.be.true;
        });
    });
    
    describe('getHashedIDFromMap', () => {
        it('should retrieve the hashed ID from id_hash_map', async () => {
            const originalID = uuidv4();  // Generate a UUID dynamically
            const tableName = 'test-table';
            const hashedID = 'hashed-id';
            
            sandbox.stub(database, 'query').resolves([{ hashed_id: hashedID }]);
            const result = await idUtils.getHashedIDFromMap(originalID, tableName);
            
            expect(result).to.equal(hashedID);
        });
        
        it('should return null if the hashed ID is not found', async () => {
            const originalID = uuidv4();  // Generate a UUID dynamically
            const tableName = 'test-table';
            
            sandbox.stub(database, 'query').resolves([]);
            const result = await idUtils.getHashedIDFromMap(originalID, tableName);
            
            expect(result).to.be.null;
        });
    });
    
    describe('validateToken', () => {
        it('should validate a token with a matching hashed employee ID', async () => {
            const token = 'valid-token';
            const secret = 'test-secret';
            const decodedToken = { sub: 'hashed-id' };
            
            sandbox.stub(jwt, 'verify').returns(decodedToken);
            sandbox.stub(idUtils, 'getHashedIDFromMap').resolves('hashed-id');
            
            const result = await idUtils.validateToken(token, secret);
            expect(result).to.equal(decodedToken);
        });
        
        it('should return null for an invalid token', async () => {
            const token = 'invalid-token';
            const secret = 'test-secret';
            
            sandbox.stub(jwt, 'verify').throws(new Error('Invalid token'));
            const result = await idUtils.validateToken(token, secret);
            
            expect(result).to.be.null;
        });
        
        it('should throw an error if the hashed employee ID does not match', async () => {
            const token = 'valid-token';
            const secret = 'test-secret';
            const decodedToken = { sub: 'hashed-id' };
            
            sandbox.stub(jwt, 'verify').returns(decodedToken);
            sandbox.stub(idUtils, 'getHashedIDFromMap').resolves('different-hashed-id');
            
            try {
                await idUtils.validateToken(token, secret);
            } catch (error) {
                expect(error.message).to.equal('Invalid token payload');
            }
        });
    });
});
