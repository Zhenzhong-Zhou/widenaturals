const auditLogDAL = require('../dal/logManagement/auditLogDAL');
const { validateDateRange } = require('../utilities/validator/validateDateRange');
const { errorHandler } = require("../middlewares/errorHandler");

const fetchAllAuditLogs = async () => {
    return await auditLogDAL.getAllAuditLogs();
};

const fetchAuditLogsByTable = async (tableName) => {
    if (!tableName) {
        throw errorHandler(400, 'Table name is required');
    }
    return await auditLogDAL.getAuditLogsByTable(tableName);
};

const fetchAuditLogsByEmployee = async (employeeId) => {
    if (!employeeId) {
        throw errorHandler(400, 'Employee ID is required');
    }
    return await auditLogDAL.getAuditLogsByEmployee(employeeId);
};

const fetchAuditLogsByDateRange = async (startDate, endDate) => {
    if (!validateDateRange(startDate, endDate)) {
        throw errorHandler(400, 'Invalid date range');
    }
    return await auditLogDAL.getAuditLogsByDateRange(startDate, endDate);
};

module.exports = {
    fetchAllAuditLogs,
    fetchAuditLogsByTable,
    fetchAuditLogsByEmployee,
    fetchAuditLogsByDateRange,
};