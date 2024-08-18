const {maskEmail, maskPhoneNumber, maskName, maskRoleId, maskTableName} = require("./helpers/maskHelper");

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
    
    // Default: Mask any other string by keeping only the last 4 characters unmasked
    return value.replace(/.(?=.{4})/g, '*'); // Keep only the last 4 characters unmasked
};

// Utility to mask specific fields based on their type
const maskField = (fieldName, value) => {
    switch (fieldName) {
        case 'email':
            return maskEmail(value);
        case 'phone_number':
            return maskPhoneNumber(value);
        case 'first_name':
        case 'last_name':
            return maskName(value);
        case 'role_id':
            return maskRoleId(value);
        case 'table_name':
            return maskTableName(value);
        default:
            return maskSensitiveInfo(value);
    }
};


module.exports = {maskSensitiveInfo, maskField};