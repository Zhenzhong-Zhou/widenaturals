const {pathToRegexp} = require("path-to-regexp");
const serviceMapping = require("./constants/routePatterns");

const getServiceName = (url) => {
    for (const { pattern, service } of serviceMapping) {
        const regexp = pathToRegexp(pattern);
        if (regexp.test(url)) {
            return service;
        }
    }
    return 'general_service';
};

module.exports = getServiceName;