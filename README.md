# 24/7 Minecraft Server Bot

A robust Node.js bot that maintains a persistent connection to Minecraft servers with automatic reconnection, chat monitoring, and basic server management features.

## Features

- **24/7 Persistent Connection**: Maintains continuous connection to Minecraft server
- **Automatic Reconnection**: Handles disconnections with exponential backoff retry logic
- **Anti-Idle System**: Prevents being kicked for inactivity
- **Chat Monitoring**: Logs all chat messages and responds to mentions
- **Command System**: Built-in commands for server management and player interaction
- **Player Welcome**: Automatically welcomes new players (configurable)
- **Comprehensive Logging**: Detailed logging with file rotation
- **Pathfinding**: Advanced movement capabilities with mineflayer-pathfinder
- **Health Monitoring**: Tracks bot health, food, and status
- **Graceful Shutdown**: Proper cleanup on process termination

## Installation

1. Clone this repository or download the files
2. Install dependencies:
```bash
npm install mineflayer mineflayer-pathfinder winston dotenv node-cron
