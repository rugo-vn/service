/* eslint-disable */

import { assert, expect } from 'chai';
import { createRunner } from '../src/index.js';
import * as sample from './sample.service.js';

describe('Rugo service test', () => {
  it('should simple run in file', async () => {
    const runner = createRunner();
    runner.add(sample);

    await runner.start();

    // simple add
    const result = await runner.call('sample.add', { a: 1, b: 2 });
    expect(result).to.be.eq(3);

    // list service
    const list = await runner.call('$node.services');
    expect(list.map(item => item.name)).is.members(['sample', '$node']);

    // get meta
    const meta = await runner.call('sample.getMeta', null, { meta: { foo: 'bar' } });
    expect(meta).to.has.property('foo', 'bar');

    await runner.stop();
  });

  it('should get settings from env', async () => {
    const runner = createRunner({ RUGO_PORT: 3000 });
    runner.add(sample);

    await runner.start();

    const result = await runner.call('sample.getSettings');
    expect(result).to.has.property('abc', 'def');
    expect(result).to.has.property('foo', 'bar');
    expect(result).to.has.property('port', 3000);

    await runner.stop();
  });

  it('should not call invalid action', async () => {
    const runner = createRunner();
    runner.add(sample);

    await runner.start();

    try {
      await runner.call('sample.subtract', { a: 1, b: 2 });
      assert.fail();
    } catch (e) {
      expect(e).to.has.property('message', 'Service \'sample.subtract\' is not found.');
    }

    await runner.stop();
  });

  it('should auto load services', async () => {
    const runner = createRunner({ RUGO_SERVICES_0: './test/sample.service.js' });

    await runner.load();
    await runner.start();

    const result = await runner.call('sample.add', { a: 1, b: 2 });
    expect(result).to.be.eq(3);

    await runner.stop();
  });

  it('should run method', async () => {
    const runner = createRunner();

    runner.add({
      name: 'foo',
      actions: {
        test(){ return this.speak(); }
      },
      methods: {
        speak(){ return 'meow'; }
      }
    })

    await runner.start();

    const res = await runner.call('foo.test');
    expect(res).to.be.eq('meow');

    await runner.stop();
  });

  it('should nested meta', async () => {
    const runner = createRunner();

    runner.add({
      name: 'foo',
      actions: { async next(ctx){
        await ctx.call('bar.next', null, { meta: { month: 'august', hello: 'world', day: 'monday' } });
        return await ctx.call('bar.next', null, { meta: { hello: 'kitty', day: 'sunday' } });
      } }
    });

    runner.add({
      name: 'bar',
      actions: { async next(ctx){ return await ctx.call('abc.next', null, { meta: { hello: 'doraemon', time: 'morning' } }) } }
    });

    runner.add({
      name: 'abc',
      actions: { async next(ctx){ return ctx.meta } }
    });

    await runner.start();

    const res = await runner.call('foo.next');

    expect(res).to.has.property('hello', 'doraemon');
    expect(res).to.has.property('time', 'morning');
    expect(res).to.has.property('day', 'sunday');

    await runner.stop();
  });

  it('should run hooks', async () => {
    const runner = createRunner();
    runner.add({
      name: 'foo',
      actions: {
        cat({ meta }){ return meta.prefix + ' meow '; },
        dog({ meta }){ return meta.prefix + ' growl '; },
        async cow({ meta }){ return meta.prefix + ' moo '; },
        sheep({ meta }){ return meta.prefix + ' baaa '; }
      },
      hooks: {
        before: {
          all(ctx){
            ctx.meta.prefix = 'Kitty'
          },

          dog: 'addName',
          cow: ['addName'],

          sheep(){
            return 'slient';
          }
        },
        after: {
          async all(_, res){
            return res + '--';
          },

          cow(_, res){
            return res + '++';
          }
        }
      },
      methods: {
        addName(ctx){
          ctx.meta.prefix = 'Rich';
        }
      }
    })

    await runner.start();

    expect(await runner.call('foo.cat')).to.be.eq('Kitty meow --');
    expect(await runner.call('foo.dog')).to.be.eq('Rich growl --');
    expect(await runner.call('foo.cow')).to.be.eq('Rich moo ++');
    expect(await runner.call('foo.sheep')).to.be.eq('slient');

    await runner.stop();
  });
});
