const {query} = require('../database/database');

const getNonDescriptiveTableName = async (tableName) => {
    const result = await query('SELECT key FROM table_metadata WHERE table_name = $1', [tableName]);
    return result.length > 0 ? result[0].key : tableName;
};

module.exports = {getNonDescriptiveTableName};