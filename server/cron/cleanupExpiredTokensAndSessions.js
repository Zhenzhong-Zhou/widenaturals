const cron = require('node-cron');
const { query } = require('../database/database');

// Function to log deletion of tokens or sessions
const logDeletion = async (data, tableName, context) => {
    const insertAuditQuery = `
        INSERT INTO audit_logs (
            context,
            table_name,
            action,
            record_id,
            employee_id,
            old_data
        ) VALUES ($1, $2, $3, $4, $5, $6)
    `;
    
    const auditValues = [
        context,
        tableName,
        'DELETE',
        data.id,            // record_id
        data.employee_id,   // employee_id
        JSON.stringify(data) // old_data
    ];
    
    await query(insertAuditQuery, auditValues);
};

const deleteOldTokensAndSessions = async () => {
    // Delete Tokens
    const tokenSelectQuery = `
        SELECT id, employee_id, token, token_type, created_at
        FROM tokens
        WHERE revoked = TRUE OR expires_at < NOW()
    `;
    const tokensToDelete = await query(tokenSelectQuery);
    
    for (const token of tokensToDelete) {
        await logDeletion('Token Deletion', 'tokens', token.id, token.employee_id, token);
        
        const tokenDeleteQuery = 'DELETE FROM tokens WHERE id = $1';
        await query(tokenDeleteQuery, [token.id]);
    }
    
    // Delete Sessions
    const sessionSelectQuery = `
        SELECT id, employee_id, token, user_agent, ip_address, created_at
        FROM sessions
        WHERE revoked = TRUE OR expires_at < NOW()
    `;
    const sessionsToDelete = await query(sessionSelectQuery);
    
    for (const session of sessionsToDelete) {
        await logDeletion('Session Deletion', 'sessions', session.id, session.employee_id, session);
        
        const sessionDeleteQuery = 'DELETE FROM sessions WHERE id = $1';
        await query(sessionDeleteQuery, [session.id]);
    }
    
    console.log('Expired or revoked tokens and sessions older than 6 months have been audited and deleted.');
};

// Schedule the cleanup job to run daily at midnight
cron.schedule('0 0 * * *', async () => {
    await deleteOldTokensAndSessions();
    console.log('Cleanup of expired tokens and sessions completed.');
});