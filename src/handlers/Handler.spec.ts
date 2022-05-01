import { EventEmitter } from 'stream';
import Handler from './Handler'

class DummyHandler extends Handler {
    handler = jest.fn();
    register = jest.fn();
    deregister = jest.fn();
}

describe('Handler', () => {
    let handler: Handler;
    let bot: any;

    beforeEach(() => {
        bot = {};
        bot.client = new EventEmitter();
        handler = new DummyHandler(bot);
    })

    describe('constructs a valid handler', () => {
        it('has a handler function', () => expect(handler.handler).toBeDefined());
        it('has a register function', () => expect(handler.register).toBeDefined());
        it('has a deregister function', () => expect(handler.deregister).toBeDefined());
    })
})