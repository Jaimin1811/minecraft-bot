const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const logger = require('./logger');
const commands = require('./commands');
const cron = require('node-cron');

class MinecraftBot {
    constructor(config) {
        this.config = config;
        this.bot = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 5000; // 5 seconds
        this.lastActivity = Date.now();
        this.antiIdleInterval = null;
        this.commands = new commands(this);
        
        // Bind methods to maintain context
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.handleReconnect = this.handleReconnect.bind(this);
    }

    async connect() {
        try {
            const botOptions = {
                host: this.config.SERVER_HOST,
                port: this.config.SERVER_PORT,
                username: this.config.BOT_USERNAME,
                version: this.config.MC_VERSION || false, // Auto-detect version
                auth: this.config.AUTH_TYPE || 'offline'
            };

            // Add password if provided (for premium accounts)
            if (this.config.BOT_PASSWORD) {
                botOptions.password = this.config.BOT_PASSWORD;
            }

            logger.info('Creating bot connection...');
            this.bot = mineflayer.createBot(botOptions);

            this.setupEventHandlers();
            this.setupAntiIdle();

            return new Promise((resolve, reject) => {
                this.bot.once('login', () => {
                    logger.info(`Bot logged in as ${this.bot.username}`);
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    resolve();
                });

                this.bot.once('error', (err) => {
                    logger.error('Bot connection error:', err);
                    reject(err);
                });
            });

        } catch (error) {
            logger.error('Failed to create bot:', error);
            throw error;
        }
    }

    setupEventHandlers() {
        // Connection events
        this.bot.on('spawn', () => {
            logger.info(`Bot spawned in world at ${this.bot.entity.position}`);
            this.setupPathfinder();
            this.sendInitialMessage();
        });

        this.bot.on('end', (reason) => {
            logger.warn(`Bot disconnected: ${reason}`);
            this.isConnected = false;
            this.handleReconnect();
        });

        this.bot.on('kicked', (reason, loggedIn) => {
            logger.warn(`Bot was kicked: ${reason} (logged in: ${loggedIn})`);
            this.isConnected = false;
            this.handleReconnect();
        });

        this.bot.on('error', (err) => {
            logger.error('Bot error:', err);
            if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
                this.handleReconnect();
            }
        });

        // Chat events
        this.bot.on('chat', (username, message) => {
            if (username === this.bot.username) return; // Ignore own messages
            
            logger.info(`<${username}> ${message}`);
            this.lastActivity = Date.now();
            
            // Handle commands
            if (message.startsWith(this.config.COMMAND_PREFIX)) {
                this.commands.handleCommand(username, message);
            }
            
            // Handle mentions
            if (message.toLowerCase().includes(this.bot.username.toLowerCase())) {
                this.handleMention(username, message);
            }
        });

        // Player events
        this.bot.on('playerJoined', (player) => {
            logger.info(`Player joined: ${player.username}`);
            if (this.config.WELCOME_MESSAGES === 'true') {
                setTimeout(() => {
                    this.bot.chat(`Welcome ${player.username}! 👋`);
                }, 2000);
            }
        });

        this.bot.on('playerLeft', (player) => {
            logger.info(`Player left: ${player.username}`);
        });

        // Health and food events
        this.bot.on('health', () => {
            if (this.bot.health <= 10) {
                logger.warn(`Low health: ${this.bot.health}/20`);
            }
        });

        this.bot.on('death', () => {
            logger.warn('Bot died! Respawning...');
            this.bot.respawn();
        });
    }

    setupPathfinder() {
        if (this.bot.loadPlugin) {
            this.bot.loadPlugin(pathfinder);
            const mcData = require('minecraft-data')(this.bot.version);
            const defaultMove = new Movements(this.bot, mcData);
            this.bot.pathfinder.setMovements(defaultMove);
            logger.info('Pathfinder loaded successfully');
        }
    }

    setupAntiIdle() {
        // Clear existing interval if any
        if (this.antiIdleInterval) {
            clearInterval(this.antiIdleInterval);
        }

        // Anti-idle mechanism - perform small actions to prevent being kicked for idling
        this.antiIdleInterval = setInterval(() => {
            if (this.isConnected && this.bot) {
                const timeSinceActivity = Date.now() - this.lastActivity;
                
                // If no activity for 5 minutes, perform anti-idle action
                if (timeSinceActivity > 300000) { // 5 minutes
                    this.performAntiIdleAction();
                    this.lastActivity = Date.now();
                }
            }
        }, 60000); // Check every minute

        // Scheduled health check every 30 minutes
        cron.schedule('*/30 * * * *', () => {
            if (this.isConnected && this.bot) {
                logger.info(`Health Check - Bot status: Online | Health: ${this.bot.health}/20 | Food: ${this.bot.food}/20`);
                logger.info(`Players online: ${Object.keys(this.bot.players).length}`);
            }
        });
    }

    performAntiIdleAction() {
        if (!this.isConnected || !this.bot) return;

        const actions = [
            () => this.bot.swingArm(),
            () => this.bot.look(this.bot.entity.yaw + 0.1, this.bot.entity.pitch),
            () => this.bot.setControlState('jump', true).then(() => this.bot.setControlState('jump', false))
        ];

        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        
        try {
            randomAction();
            logger.debug('Performed anti-idle action');
        } catch (error) {
            logger.error('Error performing anti-idle action:', error);
        }
    }

    sendInitialMessage() {
        if (this.config.JOIN_MESSAGE) {
            setTimeout(() => {
                this.bot.chat(this.config.JOIN_MESSAGE);
            }, 3000);
        }
    }

    handleMention(username, message) {
        const responses = [
            `Hello ${username}! How can I help you?`,
            `Hi there ${username}! 👋`,
            `${username}, I'm here and active!`,
            `What's up, ${username}?`
        ];

        const response = responses[Math.floor(Math.random() * responses.length)];
        
        setTimeout(() => {
            this.bot.chat(response);
        }, 1000);
    }

    handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached. Exiting...`);
            process.exit(1);
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts; // Exponential backoff
        
        logger.info(`Attempting to reconnect in ${delay/1000} seconds... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(async () => {
            try {
                await this.connect();
            } catch (error) {
                logger.error('Reconnection failed:', error);
                this.handleReconnect();
            }
        }, delay);
    }

    disconnect() {
        if (this.antiIdleInterval) {
            clearInterval(this.antiIdleInterval);
        }

        if (this.bot) {
            logger.info('Disconnecting bot...');
            this.bot.quit('Bot shutting down');
            this.isConnected = false;
        }
    }

    // Public methods for external control
    sendMessage(message) {
        if (this.isConnected && this.bot) {
            this.bot.chat(message);
            logger.info(`Bot: ${message}`);
        }
    }

    getStatus() {
        return {
            connected: this.isConnected,
            username: this.bot ? this.bot.username : null,
            health: this.bot ? this.bot.health : null,
            food: this.bot ? this.bot.food : null,
            position: this.bot ? this.bot.entity.position : null,
            playersOnline: this.bot ? Object.keys(this.bot.players).length : 0
        };
    }
}

module.exports = MinecraftBot;
