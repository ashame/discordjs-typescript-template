import Bot from './Bot';
import logger from 'npmlog';
import fs from 'fs';
import Handler from './handlers/Handler';

jest.mock('npmlog', () => {
    const verbose = jest.fn();
    const error = jest.fn();
    const info = jest.fn();
    return {
        verbose,
        error,
        info,
    };
})

jest.mock('fs', () => {
    const readdirSync = jest.fn().mockReturnValue(['Handler.ts', 'SampleHandler.ts', 'NotAHandler.ts']);
    const readFileSync = jest.fn().mockReturnValue('export default class Handler {}');
    return {
        readdirSync,
        readFileSync,
    };
})

jest.mock(require('path').join(__dirname, './handlers/SampleHandler.ts'), () => {
    class SampleHandler extends Handler {
        handler = jest.fn();
        register = jest.fn().mockResolvedValue(true);
        deregister = jest.fn().mockResolvedValue(true);
    }
    return {
        default: SampleHandler
    }
}, { virtual: true })

describe('Bot', () => {
    let bot: Bot;

    describe('constructor', () => {
        it('should be defined', () => {
            bot = new Bot('');
            expect(new Bot('')).toBeDefined();
        });

        it('should have a client', () => {
            bot = new Bot('');
            expect(bot.client).toBeDefined();
        });

        it('should load custom config options if provided', () => {
            bot = new Bot('');
            expect(bot.config).toBeDefined();
            expect(bot.config.desuId).toBe('712532570486865931');
            expect(bot.config.hello).toBe(undefined);

            bot = new Bot('', { hello: 'world' });
            expect(bot.config).toBeDefined();
            expect(bot.config.hello).toBe('world');
        })

        it('should attempt to load handlers upon initialization', () => {
            const bot = new Bot('');
            bot.loadHandlers = jest.fn(() => Promise.resolve());
            bot.initialize();
            expect(bot.loadHandlers).toHaveBeenCalled();
        });
    });

    describe('destructor', () => {
        it('should be defined', () => {
            bot = new Bot('');
            expect(bot.destructor).toBeDefined();
        });

        it('should deregister all handlers and exit gracefully', () => {
            bot = new Bot('');
            const deregister = jest.fn().mockReturnValue(true);
            (bot as any).handlers = [{ deregister }, { deregister }];

            Object.assign(process, { exit: jest.fn() });
            bot.destructor();

            expect(deregister).toHaveBeenCalledTimes(2);
            expect(logger.verbose).toHaveBeenLastCalledWith('bot', 'deregistered handler Object');
            expect(process.exit).toHaveBeenCalledWith(0);
        });

        it('should log an error if handler fails to deregister', () => {
            bot = new Bot('');
            const deregister = jest.fn().mockReturnValue(false);
            (bot as any).handlers = [{ deregister }];

            Object.assign(process, { exit: jest.fn() });
            bot.destructor();

            expect(deregister).toHaveBeenCalled();
            expect(logger.verbose).toHaveBeenLastCalledWith('bot', 'failed to deregister handler Object');
            expect(process.exit).toHaveBeenCalledWith(0);
        });
    });

    describe('loadHandlers', () => {
        it('should retrieve and filter a list of handler files from ./handlers', () => {
            bot = new Bot('');
            bot.initialize();
            expect(fs.readdirSync).toBeCalledWith(require('path').join(__dirname, './handlers'));
            expect(logger.verbose).toBeCalledWith('bot', 'attempting to load 2 handlers');
        });

        it('should attempt to load handler files that are an instance of the Handler class', () => {
            bot = new Bot('');
            bot.initialize();
            expect(fs.readdirSync).toBeCalledWith(require('path').join(__dirname, './handlers'));
            expect(logger.verbose).toBeCalledWith('bot', 'loaded 1 handlers');
        });
    });

    describe('login', () => {
        it('should login to discord', async () => {
            bot = new Bot('');
            Object.assign(bot.client, {
                login: jest.fn(),
            });
            await bot.login();
            expect(bot.client.login).toBeCalled();
        });

        it('should return true on subsequent login attempts', async () => {
            bot = new Bot('');
            Object.assign(bot.client, {
                login: jest.fn(() => Promise.resolve()),
            });
            expect(await bot.login()).toBe(true);
            expect(await bot.login()).toBe(true);
        })

        it('should return false if login fails', async () => {
            bot = new Bot('');
            Object.assign(bot.client, {
                login: jest.fn(() => Promise.reject('Invalid token')),
            });
            expect(await bot.login()).toBe(false);
        });
    })

    afterEach(() => {
        Object.assign(process, { exit: jest.fn() });
        bot.destructor();
        expect(process.exit).toBeCalled();
    })
});