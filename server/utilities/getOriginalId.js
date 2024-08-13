const { query } = require('../database/database');

const getOriginalEmployeeId = async (hashedId) => {
    const result = await query(
        'SELECT original_id FROM id_hash_map WHERE hashed_id = $1 AND table_name = $2',
        [hashedId, 'employees']
    );
    
    if (result.length === 0) {
        throw new Error('Employee not found.');
    }
    
    return result[0].original_id;
};

module.exports = {getOriginalEmployeeId};