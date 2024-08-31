const {query} = require('../../database/database');

const buildComprehensiveTokenQuery = ({employeeId, tokenType, startDate, endDate}) => {
    let sql = `
        SELECT t.id AS token_id, t.token, t.token_type, t.created_at, t.expires_at, t.revoked,
               e.id AS employee_id, CONCAT(e.first_name, ' ', e.last_name) AS employee_name, e.email AS employee_email,
               tl.id AS log_id, tl.action, tl.performed_at, tl.ip_address, tl.user_agent, tl.details
        FROM tokens t
        JOIN employees e ON t.employee_id = e.id
        LEFT JOIN token_logs tl ON t.id = tl.token_id
        WHERE 1=1
    `;
    const params = [];
    
    if (employeeId) {
        sql += ` AND t.employee_id = $${params.length + 1}`;
        params.push(employeeId);
    }
    
    if (tokenType) {
        sql += ` AND t.token_type = $${params.length + 1}`;
        params.push(tokenType);
    }
    
    if (startDate && endDate) {
        sql += ` AND t.created_at BETWEEN $${params.length + 1} AND $${params.length + 2}`;
        params.push(startDate, endDate);
    }
    
    sql += ' ORDER BY t.created_at DESC, tl.performed_at DESC';
    
    return {sql, params};
};

const countTokens = async ({employeeId, tokenType, startDate, endDate}) => {
    try {
        const {sql, params} = buildTokenQuery({employeeId, tokenType, startDate, endDate});
        const countSql = `SELECT COUNT(*) AS total FROM (${sql}) AS subquery`;
        const result = await query(countSql, params);
        return result[0].total;
    } catch (error) {
        throw new Error('Error counting tokens: ' + error.message);
    }
};

const getTokens = async ({employeeId, tokenType, startDate, endDate, limit, offset}) => {
    try {
        const {sql, params} = buildTokenQuery({employeeId, tokenType, startDate, endDate});
        const paginatedSql = `${sql} ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        return await query(paginatedSql, [...params, limit, offset]);
    } catch (error) {
        throw new Error('Error fetching tokens: ' + error.message);
    }
};

const buildTokenLogQuery = ({tokenId}) => {
    let sql = `
        SELECT tl.id, tl.token_id, tl.action, tl.performed_at, tl.ip_address, tl.user_agent
        FROM token_logs tl
        WHERE tl.token_id = $1
    `;
    return {sql, params: [tokenId]};
};

const countTokenLogs = async ({tokenId}) => {
    try {
        const {sql, params} = buildTokenLogQuery({tokenId});
        const countSql = `SELECT COUNT(*) AS total FROM (${sql}) AS subquery`;
        const result = await query(countSql, params);
        return result[0].total;
    } catch (error) {
        throw new Error('Error counting token logs: ' + error.message);
    }
};

const getTokenLogs = async ({tokenId, limit, offset}) => {
    try {
        const {sql, params} = buildTokenLogQuery({tokenId});
        const paginatedSql = `${sql} ORDER BY tl.performed_at DESC LIMIT $2 OFFSET $3`;
        return await query(paginatedSql, [tokenId, limit, offset]);
    } catch (error) {
        throw new Error('Error fetching token logs: ' + error.message);
    }
};

module.exports = {
    countTokens,
    getTokens,
    countTokenLogs,
    getTokenLogs,
};