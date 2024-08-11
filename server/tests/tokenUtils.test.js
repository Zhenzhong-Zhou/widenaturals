let chai;
let expect;
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const { generateToken, validateToken, revokeToken, refreshTokens, validateStoredRefreshToken } = require('../utilities/auth/tokenUtils');
const { query } = require('../database/database');
const { storeInIdHashMap } = require('../utilities/idUtils');

describe('Token Utilities', () => {
    const employee = { id: 'employee-id', role_id: 'role-id' };
    const token = 'some-token';
    const secret = 'some-secret';
    
    let queryStub, jwtSignStub, jwtVerifyStub, idHashMapStub;
    
    before(async () => {
        chai = await import('chai');
        expect = chai.expect;
    });
    
    beforeEach(() => {
        // Stub the database query function
        queryStub = sinon.stub(query);
        
        // Stub the storeInIdHashMap function
        idHashMapStub = sinon.stub(storeInIdHashMap).resolves();
        
        // Mock jwt.sign and jwt.verify methods
        jwtSignStub = sinon.stub(jwt, 'sign').callsFake(() => 'mocked-token');
        jwtVerifyStub = sinon.stub(jwt, 'verify').callsFake(() => ({ sub: employee.id }));
        
        // Mock environment variables if needed
        process.env.JWT_ACCESS_SECRET = 'test-access-secret';
        process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    });
    
    afterEach(() => {
        sinon.restore(); // Restore original methods after each test
    });
    
    it('should create a token with generateToken', async () => {
        const result = await generateToken(employee, 'access');
        expect(result).to.be.a('string');
        expect(jwtSignStub).to.have.been.calledWith(sinon.match.object, sinon.match.string, sinon.match.object);
    });
    
    it('should return decoded token if valid with validateToken', () => {
        const decoded = validateToken(token, process.env.JWT_ACCESS_SECRET);
        expect(decoded).to.have.property('sub', employee.id);
    });
    
    it('should update token as revoked with revokeToken', async () => {
        queryStub.resolves([]);
        await revokeToken(token, 'some-salt');
        expect(queryStub).to.have.been.calledWith(sinon.match.string, sinon.match.array);
    });
    
    it('should return new tokens if refresh token is valid with refreshTokens', async () => {
        queryStub.onFirstCall().resolves([{ employee_id: employee.id }]);
        queryStub.onSecondCall().resolves([]);
        const tokens = await refreshTokens(token);
        expect(tokens).to.have.property('accessToken');
        expect(tokens).to.have.property('refreshToken');
    });
    
    it('should return token if valid with validateStoredRefreshToken', async () => {
        queryStub.onFirstCall().resolves([{ salt: 'some-salt' }]);
        queryStub.onSecondCall().resolves([{ id: 'token-id' }]);
        const result = await validateStoredRefreshToken(token);
        expect(result).to.be.an('object');
    });
});
