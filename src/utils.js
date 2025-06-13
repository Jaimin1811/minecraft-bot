const logger = require('./logger');

class Utils {
    /**
     * Sleep for a specified number of milliseconds
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise}
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Format uptime in a human-readable format
     * @param {number} uptimeSeconds - Uptime in seconds
     * @returns {string} Formatted uptime string
     */
    static formatUptime(uptimeSeconds) {
        const days = Math.floor(uptimeSeconds / 86400);
        const hours = Math.floor((uptimeSeconds % 86400) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = Math.floor(uptimeSeconds % 60);

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (seconds > 0) parts.push(`${seconds}s`);

        return parts.join(' ') || '0s';
    }

    /**
     * Calculate distance between two positions
     * @param {Object} pos1 - First position {x, y, z}
     * @param {Object} pos2 - Second position {x, y, z}
     * @returns {number} Distance between positions
     */
    static calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * Format Minecraft time to human readable format
     * @param {number} timeOfDay - Minecraft time ticks
     * @returns {string} Formatted time
     */
    static formatMinecraftTime(timeOfDay) {
        const hours = Math.floor(((timeOfDay + 6000) % 24000) / 1000);
        const minutes = Math.floor((((timeOfDay + 6000) % 24000) % 1000) * 0.06);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    /**
     * Validate Minecraft username
     * @param {string} username - Username to validate
     * @returns {boolean} True if valid
     */
    static isValidMinecraftUsername(username) {
        const regex = /^[a-zA-Z0-9_]{3,16}$/;
        return regex.test(username);
    }

    /**
     * Retry a function with exponential backoff
     * @param {Function} fn - Function to retry
     * @param {number} maxRetries - Maximum number of retries
     * @param {number} baseDelay - Base delay in milliseconds
     * @returns {Promise} Result of the function
     */
    static async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                
                if (attempt === maxRetries) {
                    break;
                }
                
                const delay = baseDelay * Math.pow(2, attempt);
                logger.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, error.message);
                await this.sleep(delay);
            }
        }
        
        throw lastError;
    }

    /**
     * Sanitize chat message to prevent issues
     * @param {string} message - Message to sanitize
     * @returns {string} Sanitized message
     */
    static sanitizeChatMessage(message) {
        if (typeof message !== 'string') {
            return String(message);
        }
        
        // Remove or replace problematic characters
        return message
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
            .trim()
            .substring(0, 256); // Limit length
    }

    /**
     * Parse command arguments with quoted strings support
     * @param {string} input - Command input string
     * @returns {Array} Array of arguments
     */
    static parseCommandArgs(input) {
        const args = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';
        
        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            
            if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar && inQuotes) {
                inQuotes = false;
                quoteChar = '';
            } else if (char === ' ' && !inQuotes) {
                if (current.length > 0) {
                    args.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }
        
        if (current.length > 0) {
            args.push(current);
        }
        
        return args;
    }

    /**
     * Check if a position is safe for the bot
     * @param {Object} bot - Mineflayer bot instance
     * @param {Object} position - Position to check {x, y, z}
     * @returns {boolean} True if position is safe
     */
    static isSafePosition(bot, position) {
        try {
            const block = bot.blockAt(position);
            const blockAbove = bot.blockAt(position.offset(0, 1, 0));
            const blockBelow = bot.blockAt(position.offset(0, -1, 0));
            
            // Check if there's solid ground and no blocks blocking movement
            return blockBelow && blockBelow.type !== 0 && // Solid ground
                   (!block || block.type === 0) && // No block at position
                   (!blockAbove || blockAbove.type === 0); // No block above
        } catch (error) {
            logger.warn('Error checking position safety:', error.message);
            return false;
        }
    }

    /**
     * Get random element from array
     * @param {Array} array - Array to pick from
     * @returns {*} Random element
     */
    static getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * Debounce function to limit execution frequency
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

module.exports = Utils;
