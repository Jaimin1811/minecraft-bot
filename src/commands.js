const logger = require('./logger');

class CommandHandler {
    constructor(botInstance) {
        this.bot = botInstance;
        this.commands = new Map();
        this.setupCommands();
    }

    setupCommands() {
        // Basic commands
        this.commands.set('help', {
            description: 'Show available commands',
            usage: '!help',
            execute: (username, args) => this.helpCommand(username, args)
        });

        this.commands.set('status', {
            description: 'Show bot status',
            usage: '!status',
            execute: (username, args) => this.statusCommand(username, args)
        });

        this.commands.set('time', {
            description: 'Show current server time',
            usage: '!time',
            execute: (username, args) => this.timeCommand(username, args)
        });

        this.commands.set('players', {
            description: 'List online players',
            usage: '!players',
            execute: (username, args) => this.playersCommand(username, args)
        });

        this.commands.set('ping', {
            description: 'Check bot responsiveness',
            usage: '!ping',
            execute: (username, args) => this.pingCommand(username, args)
        });

        this.commands.set('follow', {
            description: 'Make bot follow a player',
            usage: '!follow [player]',
            execute: (username, args) => this.followCommand(username, args)
        });

        this.commands.set('stop', {
            description: 'Stop following',
            usage: '!stop',
            execute: (username, args) => this.stopCommand(username, args)
        });

        this.commands.set('come', {
            description: 'Make bot come to you',
            usage: '!come',
            execute: (username, args) => this.comeCommand(username, args)
        });

        this.commands.set('say', {
            description: 'Make bot say something',
            usage: '!say <message>',
            execute: (username, args) => this.sayCommand(username, args)
        });

        this.commands.set('uptime', {
            description: 'Show bot uptime',
            usage: '!uptime',
            execute: (username, args) => this.uptimeCommand(username, args)
        });
    }

    handleCommand(username, message) {
        const prefix = this.bot.config.COMMAND_PREFIX;
        
        if (!message.startsWith(prefix)) return;

        const args = message.slice(prefix.length).trim().split(' ');
        const commandName = args.shift().toLowerCase();

        if (!this.commands.has(commandName)) {
            this.bot.bot.chat(`Unknown command: ${commandName}. Type ${prefix}help for available commands.`);
            return;
        }

        const command = this.commands.get(commandName);
        
        try {
            logger.info(`Command executed by ${username}: ${message}`);
            command.execute(username, args);
        } catch (error) {
            logger.error(`Error executing command ${commandName}:`, error);
            this.bot.bot.chat(`Error executing command: ${commandName}`);
        }
    }

    helpCommand(username, args) {
        const prefix = this.bot.config.COMMAND_PREFIX;
        
        if (args.length === 0) {
            const commandList = Array.from(this.commands.keys()).join(', ');
            this.bot.bot.chat(`Available commands: ${commandList}`);
            this.bot.bot.chat(`Use ${prefix}help <command> for specific command info.`);
        } else {
            const commandName = args[0].toLowerCase();
            const command = this.commands.get(commandName);
            
            if (command) {
                this.bot.bot.chat(`${commandName}: ${command.description}`);
                this.bot.bot.chat(`Usage: ${command.usage}`);
            } else {
                this.bot.bot.chat(`Command not found: ${commandName}`);
            }
        }
    }

    statusCommand(username, args) {
        const bot = this.bot.bot;
        const health = bot.health;
        const food = bot.food;
        const pos = bot.entity.position;
        
        this.bot.bot.chat(`Status: Online | Health: ${health}/20 | Food: ${food}/20`);
        this.bot.bot.chat(`Position: X:${Math.round(pos.x)} Y:${Math.round(pos.y)} Z:${Math.round(pos.z)}`);
    }

    timeCommand(username, args) {
        const bot = this.bot.bot;
        const timeOfDay = bot.time.timeOfDay;
        const day = Math.floor(bot.time.day);
        
        // Convert ticks to time
        const hours = Math.floor(((timeOfDay + 6000) % 24000) / 1000);
        const minutes = Math.floor((((timeOfDay + 6000) % 24000) % 1000) * 0.06);
        
        this.bot.bot.chat(`Day ${day}, ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }

    playersCommand(username, args) {
        const players = Object.keys(this.bot.bot.players);
        const playerCount = players.length;
        
        if (playerCount === 0) {
            this.bot.bot.chat('No players online.');
        } else {
            this.bot.bot.chat(`Players online (${playerCount}): ${players.join(', ')}`);
        }
    }

    pingCommand(username, args) {
        const responses = ['Pong!', 'I\'m here!', 'Bot is responsive!', '🏓 Pong!'];
        const response = responses[Math.floor(Math.random() * responses.length)];
        this.bot.bot.chat(response);
    }

    followCommand(username, args) {
        let targetPlayer = username; // Default to command sender
        
        if (args.length > 0) {
            targetPlayer = args[0];
        }

        const player = this.bot.bot.players[targetPlayer];
        
        if (!player) {
            this.bot.bot.chat(`Player ${targetPlayer} not found.`);
            return;
        }

        if (!this.bot.bot.pathfinder) {
            this.bot.bot.chat('Pathfinding not available.');
            return;
        }

        const { goals } = require('mineflayer-pathfinder');
        this.bot.bot.pathfinder.setGoal(new goals.GoalFollow(player.entity, 2), true);
        this.bot.bot.chat(`Following ${targetPlayer}`);
        
        logger.info(`Bot started following ${targetPlayer}`);
    }

    stopCommand(username, args) {
        if (this.bot.bot.pathfinder) {
            this.bot.bot.pathfinder.setGoal(null);
            this.bot.bot.chat('Stopped following.');
            logger.info('Bot stopped following');
        }
    }

    comeCommand(username, args) {
        const player = this.bot.bot.players[username];
        
        if (!player) {
            this.bot.bot.chat(`Cannot find player ${username}.`);
            return;
        }

        if (!this.bot.bot.pathfinder) {
            this.bot.bot.chat('Pathfinding not available.');
            return;
        }

        const { goals } = require('mineflayer-pathfinder');
        const goal = new goals.GoalNear(player.entity.position.x, player.entity.position.y, player.entity.position.z, 2);
        
        this.bot.bot.pathfinder.setGoal(goal);
        this.bot.bot.chat(`Coming to ${username}!`);
        
        logger.info(`Bot moving to ${username}'s position`);
    }

    sayCommand(username, args) {
        if (args.length === 0) {
            this.bot.bot.chat('Usage: !say <message>');
            return;
        }

        const message = args.join(' ');
        this.bot.bot.chat(message);
        logger.info(`Bot said (requested by ${username}): ${message}`);
    }

    uptimeCommand(username, args) {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        this.bot.bot.chat(`Uptime: ${hours}h ${minutes}m ${seconds}s`);
    }
}

module.exports = CommandHandler;
