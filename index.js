const MinecraftBot = require('./src/bot');
const logger = require('./src/logger');
const config = require('./src/config');

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('Received SIGINT. Shutting down gracefully...');
    if (bot) {
        bot.disconnect();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Received SIGTERM. Shutting down gracefully...');
    if (bot) {
        bot.disconnect();
    }
    process.exit(0);
});

let bot;

async function startBot() {
    try {
        logger.info('Starting Minecraft Bot...');
        logger.info(`Connecting to ${config.SERVER_HOST}:${config.SERVER_PORT} as ${config.BOT_USERNAME}`);
        
        bot = new MinecraftBot(config);
        await bot.connect();
        
    } catch (error) {
        logger.error('Failed to start bot:', error);
        process.exit(1);
    }
}

// Start the bot
startBot();
