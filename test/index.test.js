/* eslint-disable */

import { assert, expect } from 'chai';
import { createBroker, RugoException, ServiceError } from '../src/index.js';
import * as sample from './sample.service.js';

describe('Rugo service test', () => {
  it('should simple run in file', async () => {
    const broker = createBroker();
    broker.createService(sample);

    await broker.start();

    // simple add
    const result = await broker.call('sample.add', { a: 1, b: 2 });
    expect(result).to.be.eq(3);

    await broker.close();
  });

  it('should get settings from env', async () => {
    const broker = createBroker({ port: 3000 });
    broker.createService(sample);

    await broker.start();

    const result = await broker.call('sample.getSettings');
    expect(result).to.has.property('abc', 'def');
    expect(result).to.has.property('foo', 'bar');
    expect(result).to.has.property('port', 3000);

    await broker.close();
  });

  it('should not call invalid action', async () => {
    const broker = createBroker();
    broker.createService(sample);

    await broker.start();

    try {
      await broker.call('sample.subtract', { a: 1, b: 2 });
      assert.fail();
    } catch (e) {
      expect(e).to.has.property('message', 'Invalid action address "sample.subtract"');
    }

    await broker.close();
  });

  it('should auto load services', async () => {
    const broker = createBroker({ _services: ['./test/sample.service.js'] });

    await broker.loadServices();
    await broker.start();

    const result = await broker.call('sample.add', { a: 1, b: 2 });
    expect(result).to.be.eq(3);

    await broker.close();
  });

  it('should run method', async () => {
    const broker = createBroker();

    broker.createService({
      name: 'foo',
      actions: {
        test(){ return this.speak(); }
      },
      methods: {
        speak(){ return 'meow'; }
      }
    })

    await broker.start();

    const res = await broker.call('foo.test');
    expect(res).to.be.eq('meow');

    await broker.close();
  });

  it('should shared', async () => {
    const broker = createBroker();

    broker.createService({
      name: 'foo',
      actions: { async next(_, nextCall){
        await nextCall('bar.next', {}, { month: 'august', hello: 'world', day: 'monday' });
        return await nextCall('bar.next', {}, { hello: 'kitty', day: 'sunday' });
      } }
    });

    broker.createService({
      name: 'bar',
      actions: { async next(_, nextCall){ return await nextCall('abc.next', {}, { hello: 'doraemon', time: 'morning' }); } }
    });

    broker.createService({
      name: 'abc',
      actions: { async next(args){ return args } }
    });

    await broker.start();

    const res = await broker.call('foo.next');

    expect(res).to.has.property('hello', 'doraemon');
    expect(res).to.has.property('time', 'morning');
    expect(res).to.has.property('day', 'sunday');

    await broker.close();
  });

  it('should run hooks', async () => {
    const broker = createBroker();
    broker.createService({
      name: 'foo',
      actions: {
        cat({ prefix }){ return prefix + ' meow '; },
        dog({ prefix }){ return prefix + ' growl '; },
        async cow({ prefix }){ return prefix + ' moo '; },
        sheep({ prefix }){ return prefix + ' baaa '; }
      },
      hooks: {
        before: {
          all(args){
            args.prefix = 'Kitty'
          },

          dog: 'addName',
          cow: ['addName'],

          sheep(){
            return 'slient';
          }
        },
        after: {
          async all(res){
            return res + '--';
          },

          cow(res){
            return res + '++';
          }
        }
      },
      methods: {
        addName(args){
          args.prefix = 'Rich';
        }
      }
    })

    await broker.start();

    expect(await broker.call('foo.cat')).to.be.eq('Kitty meow --');
    expect(await broker.call('foo.dog')).to.be.eq('Rich growl --');
    expect(await broker.call('foo.cow')).to.be.eq('Rich moo ++');
    expect(await broker.call('foo.sheep')).to.be.eq('slient');

    await broker.close();
  });

  it('should catch error', async () => {
    const broker = createBroker({ port: 3000 });
    broker.createService(sample);

    await broker.start();

    try {
      await broker.call('sample.throwError');
      assert.fail('should error')
    } catch (err){
      expect(err[0] instanceof RugoException).to.be.eq(true);
      expect(err[0]).to.has.property('status', 400);
    }

    try {
      await broker.call('sample.throwRugoException');
      assert.fail('should error')
    } catch (err){
      expect(err[0] instanceof RugoException).to.be.eq(true);
      expect(err[0]).to.has.property('status', 400);
    }

    try {
      await broker.call('sample.throwServiceError');
      assert.fail('should error')
    } catch (err){
      expect(err[0] instanceof RugoException).to.be.eq(true);
      expect(err[0] instanceof ServiceError).to.be.eq(true);

      expect(err[0]).to.has.property('status', 500);
    }

    await broker.close();
  });
});
