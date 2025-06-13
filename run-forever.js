const { spawn } = require('child_process');
const path = require('path');

console.log('Starting 24/7 Minecraft Bot Manager...');
console.log('Bot will automatically restart if it crashes');
console.log('Press Ctrl+C to stop completely');

let restartCount = 0;
const maxRestarts = 100; // Prevent infinite restart loops

function startBot() {
    restartCount++;
    
    if (restartCount > maxRestarts) {
        console.log(`Maximum restart limit (${maxRestarts}) reached. Stopping.`);
        process.exit(1);
    }

    console.log(`[${new Date().toLocaleString()}] Starting bot (Attempt #${restartCount})`);
    
    const bot = spawn('node', ['index.js'], {
        stdio: 'inherit',
        cwd: process.cwd()
    });

    bot.on('close', (code) => {
        if (code === 0) {
            console.log(`[${new Date().toLocaleString()}] Bot stopped normally`);
            process.exit(0);
        } else {
            console.log(`[${new Date().toLocaleString()}] Bot crashed with code ${code}`);
            console.log(`[${new Date().toLocaleString()}] Restarting in 10 seconds...`);
            
            setTimeout(() => {
                startBot();
            }, 10000);
        }
    });

    bot.on('error', (err) => {
        console.error(`[${new Date().toLocaleString()}] Failed to start bot:`, err);
        setTimeout(() => {
            startBot();
        }, 10000);
    });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[SIGINT] Shutting down bot manager...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n[SIGTERM] Shutting down bot manager...');
    process.exit(0);
});

// Start the bot
startBot();