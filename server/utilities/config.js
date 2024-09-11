// Load environment variables from .env if not in production
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const logger = require('../utilities/logger');

const replacePlaceholders = (configString) => {
    return configString.replace(/\$\{(\w+)}/g, (_, name) => {
        const value = process.env[name];
        if (!value) {
            logger.warn(`Warning: Environment variable ${name} is not set.`);
        }
        return value || '';
    });
};

const config = (configPath) => {
    const rawConfig = fs.readFileSync(configPath, 'utf8');
    const processedConfigString = replacePlaceholders(rawConfig);
    
    let config;
    if (configPath.endsWith('.json')) {
        config = JSON.parse(processedConfigString);
    } else if (configPath.endsWith('.yml') || configPath.endsWith('.yaml')) {
        config = yaml.load(processedConfigString);
    } else {
        throw new Error('Unsupported configuration file format. Please use JSON or YAML.');
    }
    
    const baseUrl = process.env.BASE_URL;
    
    if (config.config && config.config.target) {
        config.config.target = config.config.target.replace('${BASE_URL}', baseUrl);
    } else {
        console.warn('Warning: target is not defined in the configuration file.');
    }
    
    if (config.scenarios) {
        config.scenarios.forEach(scenario => {
            scenario.flow.forEach(step => {
                if (step.get && step.get.url && step.get.url.startsWith('/')) {
                    step.get.url = `${baseUrl}${step.get.url}`;
                }
            });
        });
    } else {
        console.warn('Warning: scenarios are not defined in the configuration file.');
    }
    
    return config;
};

const getConfigPath = () => {
    let configPath;
    if (process.env.NODE_ENV === 'production') {
        configPath = path.join(__dirname, '../config/processed_config.json');
    } else {
        const yamlPath = path.join(__dirname, '../tests/processed_stress-test.yml');
        const jsonPath = path.join(__dirname, '../config/processed_config.json');
        
        if (fileExists(yamlPath)) {
            configPath = yamlPath;
        } else if (fileExists(jsonPath)) {
            logger.warn(`YAML configuration file not found: ${yamlPath}. Using JSON configuration.`);
            configPath = jsonPath;
        } else {
            logger.error('Neither YAML nor JSON configuration files found.');
            process.exit(1);
        }
    }
    
    // Verify if the configuration file exists
    if (!fileExists(configPath)) {
        logger.error(`Configuration file not found: ${configPath}`);
        process.exit(1);
    }
    
    return configPath;
};

const fileExists = (filePath) => {
    try {
        return fs.existsSync(filePath);
    } catch (err) {
        return false;
    }
};

module.exports = {
    replacePlaceholders,
    loadConfig: config,
    getConfigPath
};