#!/bin/bash

# Create logs directory if it doesn't exist
mkdir -p logs

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Starting Minecraft Bot..."
echo "Bot will restart automatically if it crashes"
echo "Press Ctrl+C to stop the bot"

# Start the bot with auto-restart
while true; do
    echo "$(date): Starting bot..."
    node index.js
    exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo "$(date): Bot stopped normally"
        break
    else
        echo "$(date): Bot crashed with exit code $exit_code, restarting in 10 seconds..."
        sleep 10
    fi
done