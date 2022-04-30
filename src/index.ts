import logger from 'npmlog';
import Bot from './Bot';

const token = process.env.TOKEN ?? new Error('No token found');
let config;

try {
    config = require('../config.json');
} catch { }

if (token instanceof Error) throw token;

logger.enableColor();
if (process.env.LOG_LEVEL) logger.level = process.env.LOG_LEVEL;

const bot = new Bot(token, config);

bot.login();

bot.once('ready', () => {
    console.log('avgcold tbh...');
})