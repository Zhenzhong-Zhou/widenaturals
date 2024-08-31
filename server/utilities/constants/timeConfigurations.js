const MILLISECONDS_IN_A_MINUTE = 60 * 1000;

const TimeConfigurations = {
    TOKEN: {
        ACCESS_EXPIRY: 15 * MILLISECONDS_IN_A_MINUTE,  // 15 minutes
        REFRESH_EXPIRY: 7 * 24 * 60 * MILLISECONDS_IN_A_MINUTE, // 7 days
        REFRESH_RENEWAL_THRESHOLD: 4 * 60 * MILLISECONDS_IN_A_MINUTE // 4 hours before expiry
    },
    SESSION: {
        EXPIRY: 30 * MILLISECONDS_IN_A_MINUTE, // 30 minutes
        EXTEND_THRESHOLD: 5 * MILLISECONDS_IN_A_MINUTE // 5 minutes before expiry
    },
    RATE_LIMIT: {
        FIFTEEN_MINUTE_WINDOW: 15 * MILLISECONDS_IN_A_MINUTE,  // 15 minutes
        TEN_MINUTE_WINDOW: 10 * MILLISECONDS_IN_A_MINUTE,      // 10 minutes
    },
    ACCOUNT: {
        LOCKOUT: 15 * MILLISECONDS_IN_A_MINUTE,  // 15 minutes
    },
};

module.exports = TimeConfigurations;