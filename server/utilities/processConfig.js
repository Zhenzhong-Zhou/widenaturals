// Load environment variables from .env if not in production
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const {replacePlaceholders} = require('./config');
const logger = require('../utilities/logger');

const processConfig = (configType, configFolder) => {
    // Get the directory of the current script
    const configDir = path.join(__dirname, configFolder);
    const configFile = configType === 'yaml' ? 'stress-test.yml' : 'config.json';
    const processedConfigFile = configType === 'yaml' ? 'processed_stress-test.yml' : 'processed_config.json';
    
    const configPath = path.join(configDir, configFile);
    const processedConfigPath = path.join(configDir, processedConfigFile);
    
    if (!fs.existsSync(configPath)) {
        logger.error(`Config file ${configPath} does not exist.`);
        return;
    }
    
    const rawConfig = fs.readFileSync(configPath, 'utf8');
    let processedConfig;
    
    if (configType === 'yaml') {
        const config = yaml.load(rawConfig);
        const configString = JSON.stringify(config);
        const processedConfigString = replacePlaceholders(configString);
        processedConfig = yaml.dump(JSON.parse(processedConfigString));
    } else {
        const config = JSON.parse(rawConfig);
        const configString = JSON.stringify(config);
        const processedConfigString = replacePlaceholders(configString);
        processedConfig = JSON.parse(processedConfigString);
    }
    
    fs.writeFileSync(processedConfigPath, configType === 'yaml' ? processedConfig : JSON.stringify(processedConfig, null, 2));
};

// Process both JSON configuration in 'config' folder and YAML configuration in 'tests' folder
if (process.env.NODE_ENV === 'production') {
    processConfig('json', '../config');
} else {
    processConfig('json', '../config');
    processConfig('yaml', '../tests');
}