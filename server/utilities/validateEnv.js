const {Joi} = require("celebrate");
const logger = require("./logger");

const validateEnvironmentVariables = (port) => {
    const envVarsSchema = Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
        PORT: Joi.number().default(port),
    }).unknown().required();
    
    const { error } = envVarsSchema.validate(process.env);
    if (error) {
        logger.error('Config validation error', { error: error.message, context: 'initialization' });
        throw new Error(`Config validation error: ${error.message}`);
    }
};

module.exports = validateEnvironmentVariables;