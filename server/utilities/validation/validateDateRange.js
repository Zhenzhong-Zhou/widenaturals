const validateDateRange = (startDate, endDate) => {
    // Check if both startDate and endDate are provided
    if (!startDate || !endDate) {
        return false;
    }
    
    // Convert the strings to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if the dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return false;
    }
    
    // Ensure the start date is before or equal to the end date
    if (start > end) {
        return false;
    }
    
    return true;
};

module.exports = { validateDateRange };