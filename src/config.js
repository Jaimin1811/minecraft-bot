require('dotenv').config();

const config = {
    // Server connection settings
    SERVER_HOST: process.env.SERVER_HOST || 'localhost',
    SERVER_PORT: parseInt(process.env.SERVER_PORT) || 25565,
    MC_VERSION: process.env.MC_VERSION || false, // Auto-detect if not specified
    
    // Bot authentication
    BOT_USERNAME: process.env.BOT_USERNAME || 'MinecraftBot',
    BOT_PASSWORD: process.env.BOT_PASSWORD || '', // For premium accounts
    AUTH_TYPE: process.env.AUTH_TYPE || 'offline', // 'offline' or 'mojang'
    
    // Bot behavior settings
    COMMAND_PREFIX: process.env.COMMAND_PREFIX || '!',
    JOIN_MESSAGE: process.env.JOIN_MESSAGE || 'Bot connected! Type !help for commands.',
    WELCOME_MESSAGES: process.env.WELCOME_MESSAGES || 'true',
    
    // Logging settings
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    
    // Anti-idle settings
    ANTI_IDLE_ENABLED: process.env.ANTI_IDLE_ENABLED !== 'false',
    IDLE_TIMEOUT: parseInt(process.env.IDLE_TIMEOUT) || 300000, // 5 minutes
    
    // Reconnection settings
    MAX_RECONNECT_ATTEMPTS: parseInt(process.env.MAX_RECONNECT_ATTEMPTS) || 10,
    RECONNECT_DELAY: parseInt(process.env.RECONNECT_DELAY) || 5000, // 5 seconds
};

// Validate required configuration
const requiredConfig = ['SERVER_HOST', 'BOT_USERNAME'];
const missingConfig = requiredConfig.filter(key => !config[key]);

if (missingConfig.length > 0) {
    console.error('Missing required configuration:', missingConfig.join(', '));
    console.error('Please check your .env file or environment variables.');
    process.exit(1);
}

// Log configuration (excluding sensitive data)
console.log('Bot Configuration:');
console.log(`- Server: ${config.SERVER_HOST}:${config.SERVER_PORT}`);
console.log(`- Bot Username: ${config.BOT_USERNAME}`);
console.log(`- Auth Type: ${config.AUTH_TYPE}`);
console.log(`- Command Prefix: ${config.COMMAND_PREFIX}`);
console.log(`- MC Version: ${config.MC_VERSION || 'Auto-detect'}`);
console.log(`- Log Level: ${config.LOG_LEVEL}`);

module.exports = config;
