const debounceMap = new Map();

const debounceTokenRefresh = (sessionId, delay = 2000) => {
    const currentTime = Date.now();
    if (debounceMap.has(sessionId)) {
        const lastRefreshTime = debounceMap.get(sessionId);
        if (currentTime - lastRefreshTime < delay) {
            return false; // Too soon to refresh again
        }
    }
    debounceMap.set(sessionId, currentTime); // Store the current time as the last refresh attempt
    return true; // Allow refresh
};

module.exports = debounceTokenRefresh;