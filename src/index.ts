import Bot from './Bot';

const token = process.env.TOKEN ?? new Error('No token found');

if (token instanceof Error) throw token;

const bot = new Bot(token);

bot.login();

bot.once('ready', () => {
    console.log('avgcold tbh...');
})