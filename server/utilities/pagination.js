const getPagination = (req) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};

module.exports = { getPagination };