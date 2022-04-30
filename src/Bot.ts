import { Client, Intents } from 'discord.js';
import fs from 'fs';
import { join } from 'path';
import EventEmitter from 'events';
import { verbose as log, error, info } from 'npmlog';
import Handler from './handlers/Handler';

interface Events {
    ready: () => void;
}

declare interface Bot {
    on<U extends keyof Events>(event: U, listener: Events[U]): this;
    once<U extends keyof Events>(event: U, listener: Events[U]): this;
    emit<U extends keyof Events>(event: U, ...args: Parameters<Events[U]>): boolean;
}

class Bot extends EventEmitter {
    private _initStage: number = 1;
    private loggedIn: boolean = false;
    private readonly handlers: Handler[];
    private readonly token: string;
    readonly client: Client;

    constructor(token: string) {
        super();
        this.client = new Client({
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MEMBERS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
            ],
            partials: ['MESSAGE', 'REACTION', 'GUILD_MEMBER'],
        });
        this.handlers = [];
        this.client.once('ready', this.initialize);
        this.token = token;

        process.on('SIGINT', () => this.destructor());
        process.on('exit', () => this.destructor());
    }

    destructor = () => {
        let handler;
        while ((handler = this.handlers.pop())) {
            if (handler.deregister())
                log('bot', `deregistered handler ${handler.constructor.name}`);
            else
                log('bot', `failed to deregister handler ${handler.constructor.name}`);
        }
        process.exit(0);
    }

    loadHandlers = async () => {
        const handlerFiles = fs
            .readdirSync(join(__dirname, './handlers'))
            .filter(f => (f.endsWith('.js') || f.endsWith('.ts')) && !f.startsWith('Handler') && !f.includes('.spec.') && !f.includes('.test.'));
        log('bot', `attempting to load ${handlerFiles.length} handlers`);

        for (const fileName of handlerFiles) {
            try {
                const handler = new (require(join(__dirname, `./handlers/${fileName}`)).default)(this);
                if (handler instanceof Handler) {
                    handler.register() && this.handlers.push(handler);
                };
            } catch (e) {
                error('bot', `error loading handler for file ${fileName}`, e);
            }
        }
        log('bot', `loaded ${this.handlers.length} handlers`);
        info('bot', `loaded handlers: ${this.handlers.map(h => h.constructor.name).join(', ')}`);
    }

    initialize = () => {
        if (--this._initStage === 0)
            this.loadHandlers().then(() => this.emit('ready'));
    }

    login = async () => {
        if (this.loggedIn) return true;
        await this.client.login(this.token);
        return (this.loggedIn = true);
    }
}

export default Bot;