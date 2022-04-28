import { Client, Intents } from 'discord.js';
import EventEmitter from 'events';

interface Events {
    ready: () => void;
}

declare interface Bot {
    on<U extends keyof Events>(event: U, listener: Events[U]): this;
    once<U extends keyof Events>(event: U, listener: Events[U]): this;
    emit<U extends keyof Events>(event: U, ...args: Parameters<Events[U]>): boolean;
}

class Bot extends EventEmitter {
    private loggedIn: boolean = false;
    private readonly token: string;
    readonly client: Client;

    constructor(token: string) {
        super();
        this.client = new Client({
            intents: [Intents.FLAGS.GUILDS]
        });
        this.client.once('ready', () => void this.emit('ready'));
        this.token = token;
    }

    login = async () => {
        if (this.loggedIn) return true;
        await this.client.login(this.token);
        return (this.loggedIn = true);
    }
}

export default Bot;