import Bot from '../Bot';

abstract class Handler {
    protected registered: boolean = false;
    abstract handler: (...args: any) => any;
    protected readonly bot: Bot;
    constructor(bot: Bot) {
        this.bot = bot;
    }

    abstract register(): boolean;
    abstract deregister(): boolean;
}

export default Handler;