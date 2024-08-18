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
    
    // todo mask too much? => mask new data
    // Mask Table Names or Other Identifiers
    if (/^[a-zA-Z_]+$/.test(value)) { // If the value is a string with only letters and underscores
        return '*'.repeat(value.length); // Replace all characters with asterisks
    }
    
    // Default: Mask any other string by keeping only the last 4 characters unmasked
    return value.replace(/.(?=.{4})/g, '*'); // Keep only the last 4 characters unmasked
};

module.exports = {maskSensitiveInfo};