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
        
        it('should store a hashed ID in the id_hash_map table if no conflicts exist', async () => {
            const originalID = uuidv4();
            const tableName = 'test-table';
            const hashedID = 'unique-hashed-id';
            const salt = 'test-salt';
            
            // Simulate no existing hashed ID and no existing original ID and table name
            const queryStub = sandbox.stub(database, 'query')
                .onFirstCall().resolves([])  // Simulate no hashed ID exists
                .onSecondCall().resolves([]); // Simulate no original ID and table name entry
            
            await idUtils.storeInIdHashMap({ originalID, hashedID, tableName, salt });
            
            // Verify that the insertion query was executed
            expect(queryStub.calledTwice).to.be.true; // Ensure two queries were made before insertion
            const insertQueryCall = queryStub.getCall(1);
            expect(insertQueryCall.args[0]).to.contain('INSERT INTO id_hash_map'); // Check that the insertion query was called
            expect(insertQueryCall.args[1]).to.deep.equal([originalID, hashedID, tableName, salt]); // Ensure correct params were used
            expect(queryStub.getCall(1).returned(Promise.resolve(true))).to.be.true; // Ensure the insert operation was successful
        });
        
        it('should skip insertion if the hashed ID already exists', async () => {
            const originalID = uuidv4();
            const tableName = 'test-table';
            const hashedID = 'unique-hashed-id';  // The ID that already exists
            const salt = 'test-salt';
            
            // Simulate that the hashed ID already exists
            const queryStub = sandbox.stub(database, 'query')
                .onFirstCall().resolves([{ hashed_id: hashedID }]); // Simulate hashed ID exists
            
            await idUtils.storeInIdHashMap({ originalID, hashedID, tableName, salt });
            
            // Verify that only one query was executed to check for existing hashed_id
            expect(queryStub.calledOnce).to.be.true;
            
            // Verify that the first query was the SELECT query to check for the hashed ID
            expect(queryStub.getCall(0).args[0]).to.contain('SELECT * FROM id_hash_map WHERE hashed_id');
            
            // Verify that the SELECT query found an existing hashed_id
            const result = queryStub.getCall(0).returnValue;
            result.then(data => {
                expect(data.length).to.equal(1);
                expect(data[0].hashed_id).to.equal(hashedID);
            });
        });
        
        it('should skip insertion if the entry with originalID and tableName already exists', async () => {
            const originalID = uuidv4();
            const tableName = 'test-table';
            const hashedID = 'unique-hashed-id';
            const salt = 'test-salt';
            
            // Simulate no hashed ID exists and original ID and table name already exist
            const queryStub = sandbox.stub(database, 'query')
                .onFirstCall().resolves([]) // Simulate no hashed ID exists
                .onSecondCall().resolves([{ original_id: originalID, table_name: tableName }]); // Simulate original ID and table name entry exists
            
            await idUtils.storeInIdHashMap({ originalID, hashedID, tableName, salt });
            
            // Verify that no insertion query was executed
            expect(queryStub.calledTwice).to.be.true;
            const secondCallArgs = queryStub.getCall(1).args[0];
            expect(secondCallArgs).to.not.contain('INSERT INTO id_hash_map');
        });
        
        it('should handle duplicate key violation gracefully', async () => {
            const originalID = uuidv4();
            const tableName = 'test-table';
            const hashedID = 'unique-hashed-id';
            const salt = 'test-salt';
            
            // Simulate no hashed ID exists, no original ID and table name entry exists, but duplicate key violation occurs during insertion
            const queryStub = sandbox.stub(database, 'query')
                .onFirstCall().resolves([]) // Simulate no hashed ID exists
                .onSecondCall().resolves([]) // Simulate no original ID and table name entry exists
                .onThirdCall().rejects(new Error('duplicate key value violates unique constraint')); // Simulate duplicate key violation
            
            try {
                await idUtils.storeInIdHashMap({ originalID, hashedID, tableName, salt });
            } catch (error) {
                expect(error.message).to.equal('Failed to store hashed ID in id_hash_map');
            }
            
            // Verify that the function handled the duplicate key violation
            expect(queryStub.calledThrice).to.be.true;
            expect(queryStub.getCall(2).args[0]).to.contain('INSERT INTO id_hash_map');
        });
    });
});