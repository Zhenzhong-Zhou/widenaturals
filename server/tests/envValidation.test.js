const {Joi} = require('celebrate');
const assert = require('assert');

describe('Environment Variable Validation', () => {
    it('should validate environment variables successfully', () => {
        const envVarsSchema = Joi.object({
            NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
            PORT: Joi.number().default(3000),
        }).unknown().required();
        
        const result = envVarsSchema.validate({
            NODE_ENV: 'development',
            PORT: 3000,
        });
        
        assert.strictEqual(result.error, undefined);
    });
    
    it('should throw an error for invalid environment variables', () => {
        const envVarsSchema = Joi.object({
            NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
            PORT: Joi.number().default(3000),
        }).unknown().required();
        
        const result = envVarsSchema.validate({
            NODE_ENV: 'invalid',
        });
        
        assert.notStrictEqual(result.error, undefined);
    });
});