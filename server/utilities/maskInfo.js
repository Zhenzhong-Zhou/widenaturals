const maskSensitiveInfo = (value) => {
    if (typeof value !== 'string') return value; // If it's not a string, return as is
    
    // Mask Email
    if (value.includes('@')) {
        const [localPart, domain] = value.split('@');
        return localPart.slice(0, 2) + '*'.repeat(localPart.length - 2) + '@' + domain;
    }
    
    // Mask UUID or Hashed ID
    if (value.length === 36 && value.includes('-')) { // Roughly identifying a UUID
        return value.replace(/.(?=.{8})/g, '*'); // Mask all but the last 8 characters
    }
    
    if (value.length > 16) {
        return value.slice(0, 4) + '*'.repeat(value.length - 8) + value.slice(-4); // Keep the first 4 and last 4 characters
    }
    
    // Mask Name
    return value.replace(/.(?=.{4})/g, '*'); // Keep only the last 4 characters unmasked
};

module.exports = maskSensitiveInfo;