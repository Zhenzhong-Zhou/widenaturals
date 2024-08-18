const getPagination = (req, totalRecords) => {
    let { page = 1, limit = 10 } = req.query;
    
    // Ensure page and limit are positive integers
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);
    
    if (isNaN(page) || page <= 0) {
        page = 1;
    }
    
    if (isNaN(limit) || limit <= 0) {
        limit = 10;
    }
    
    // Optional: Set a maximum limit to prevent excessive data requests
    const MAX_LIMIT = 100;
    if (limit > MAX_LIMIT) {
        limit = MAX_LIMIT;
    }
    
    const offset = (page - 1) * limit;
    
    // Calculate total pages
    const totalPages = Math.ceil(totalRecords / limit);
    
    return { page, limit, offset, totalPages };
};

module.exports = { getPagination };