const validateDateRange = (startDate, endDate) => {
    // Check if both startDate and endDate are provided
    if (!startDate || !endDate) {
        throw new Error('Both startDate and endDate must be provided');
    }
    
    // Convert the strings to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if the dates are valid
    if (isNaN(start.getTime())) {
        throw new Error(`Invalid startDate: ${startDate}`);
    }
    if (isNaN(end.getTime())) {
        throw new Error(`Invalid endDate: ${endDate}`);
    }
    
    // Ensure the start date is before or equal to the end date
    if (start > end) {
        throw new Error('startDate must be before or equal to endDate');
    }
    
    return true;
};

module.exports = { validateDateRange };