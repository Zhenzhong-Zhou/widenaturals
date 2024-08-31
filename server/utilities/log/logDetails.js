const createLoginDetails = (userAgent, method = 'standard', location = 'Unknown', actionType = 'login', customDetails = {}) => {
    // Validate essential inputs
    if (!userAgent || typeof userAgent !== 'string') {
        throw new Error('User Agent is required and must be a non-empty string');
    }
    
    // Ensure customDetails is an object
    if (typeof customDetails !== 'object' || Array.isArray(customDetails)) {
        throw new Error('Custom details must be an object');
    }
    
    return {
        method,
        device: userAgent,
        location,
        timestamp: new Date().toISOString(),
        actionType,
        ...customDetails,
    };
};

module.exports = {createLoginDetails};