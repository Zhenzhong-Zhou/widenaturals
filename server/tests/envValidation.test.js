(async () => {
    const { expect } = (await import('chai')).default;
    const Joi = require('celebrate').Joi;
    
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
            
            expect(result.error).to.be.undefined;
        });
        
        it('should throw an error for invalid environment variables', () => {
            const envVarsSchema = Joi.object({
                NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
                PORT: Joi.number().default(3000),
            }).unknown().required();
            
            const result = envVarsSchema.validate({
                NODE_ENV: 'invalid',
            });
            
            expect(result.error).to.not.be.undefined;
        });
    });
    
    run(); // This is necessary to start Mocha tests in async IIFE
})();