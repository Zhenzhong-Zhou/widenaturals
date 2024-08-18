// Helper function to partially mask table names
const maskTableName = (tableName) => {
    const visiblePartLength = Math.ceil(tableName.length / 2);
    const maskedPart = '*'.repeat(tableName.length - visiblePartLength + 3);
    return tableName.substring(0, visiblePartLength) + maskedPart;
};

// Helper functions for specific fields
const maskEmail = (email) => {
    const [localPart, domain] = email.split('@');
    return localPart.slice(0, 2) + '*'.repeat(localPart.length - 2) + '@' + domain;
};

const maskPhoneNumber = (phoneNumber) => {
    return phoneNumber.replace(/\d(?=\d{4})/g, '*');
};

const maskName = (name) => {
    return name[0] + '*'.repeat(name.length - 1);
};

const maskRoleId = (roleId) => {
    return '*****' + roleId.slice(-5);
};

module.exports = {
    maskTableName,
    maskEmail,
    maskPhoneNumber,
    maskName,
    maskRoleId,
};