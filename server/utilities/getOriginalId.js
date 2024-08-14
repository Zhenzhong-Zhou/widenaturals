const { query } = require('../database/database');

const getOriginalId = async (hashedId, tableName) => {
    const result = await query(
        'SELECT original_id FROM id_hash_map WHERE hashed_id = $1 AND table_name = $2',
        [hashedId, tableName]
    );
    
    if (result.length === 0) {
        throw new Error(`${tableName.slice(0, -1).toUpperCase()} not found.`);
    }
    
    return result[0].original_id;
};

module.exports = { getOriginalId };
