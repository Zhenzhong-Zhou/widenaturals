const { maskEmail, maskPhoneNumber, maskName, maskRoleId, maskTableName } = require("./helpers/maskHelper");

const defaultMaskRules = {
    email: maskEmail,
    phone_number: maskPhoneNumber,
    first_name: maskName,
    last_name: maskName,
    role_id: maskRoleId,
    table_name: maskTableName,
    ip_address: (value) => value.replace(/\d+$/, '***'),
    // Add more default rules as needed
};

const maskSensitiveInfo = (value, fieldName, customRules = {}) => {
    const allRules = { ...defaultMaskRules, ...customRules };
    
    if (allRules[fieldName]) {
        return allRules[fieldName](value);
    }
    
    if (typeof value !== 'string') return value;
    
    // General fallback masking logic
    if (value.includes('@')) {
        return maskEmail(value);
    }
    if (value.length === 36 && value.includes('-')) {
        return maskRoleId(value); // Assuming this is a UUID
    }
    if (value.length > 16) {
        return value.slice(0, 4) + '*'.repeat(value.length - 8) + value.slice(-4);
    }
    return value.replace(/.(?=.{4})/g, '*');
};

const maskNestedData = (nestedData, customRules) => {
    const maskedData = {};
    
    for (const key in nestedData) {
        if (nestedData.hasOwnProperty(key)) {
            maskedData[key] = maskSensitiveInfo(nestedData[key], key, customRules);
        }
    }
    
    return maskedData;
};

const maskDataArray = (dataArray, customRules = {}) => {
    return dataArray.map(data => {
        const maskedData = {};
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                // Recursively mask nested objects
                if (typeof data[key] === 'object' && data[key] !== null) {
                    maskedData[key] = Array.isArray(data[key])
                        ? data[key].map(item => maskNestedData(item, customRules))
                        : maskNestedData(data[key], customRules);
                } else {
                    maskedData[key] = maskSensitiveInfo(data[key], key, customRules);
                }
            }
        }
        return maskedData;
    });
};

module.exports = { maskSensitiveInfo, maskDataArray };