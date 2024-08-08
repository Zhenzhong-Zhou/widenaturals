require('dotenv').config(); // Load environment variables from .env

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function processConfig(configType, configFolder) {
    const configDir = path.join(__dirname, '..', configFolder);
    const configFile = configType === 'yaml' ? 'stress-test.yml' : 'config.json';
    const processedConfigFile = configType === 'yaml' ? 'processed_stress-test.yml' : 'processed_config.json';
    
    const configPath = path.join(configDir, configFile);
    const processedConfigPath = path.join(configDir, processedConfigFile);
    
    console.log(`Processing ${configType.toUpperCase()} configuration from ${configPath}`);
    
    if (!fs.existsSync(configPath)) {
        console.error(`Config file ${configPath} does not exist.`);
        return;
    }
    
    const rawConfig = fs.readFileSync(configPath, 'utf8');
    let processedConfig;
    
    if (configType === 'yaml') {
        const config = yaml.load(rawConfig);
        const configString = JSON.stringify(config);
        const processedConfigString = configString.replace(/\$\{(\w+)}/g, (_, name) => process.env[name] || '');
        processedConfig = yaml.dump(JSON.parse(processedConfigString));
    } else {
        processedConfig = rawConfig.replace(/\$\{(\w+)}/g, (_, name) => process.env[name] || '');
    }
    
    fs.writeFileSync(processedConfigPath, configType === 'yaml' ? processedConfig : JSON.stringify(processedConfig, null, 2));
    console.log(`Config processed and updated successfully for ${configType.toUpperCase()} in ${configFolder}.`);
    
    // Print the processed configuration for verification
    if (configType === 'yaml') {
        console.log(`Processed YAML Config:\n${processedConfig}`);
    } else {
        console.log(`Processed JSON Config:\n${JSON.stringify(processedConfig, null, 2)}`);
    }
}

// Process both JSON configuration in 'config' folder and YAML configuration in 'tests' folder
processConfig('json', 'config');
processConfig('yaml', 'tests');