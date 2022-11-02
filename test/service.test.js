/* eslint-disable */

import { assert, expect } from 'chai';
import { createService } from '../src/service.js';

describe('Service test', () => {
  it('should create service', async () => {
    const flows = [];

    const service = createService({}, {
      name: 'demo',
      actions: {
        async listProperties () {
          flows.push('listProperties');
          return Object.keys(this);
        }
      },
      methods: {
        testBeforeMethod () {
          flows.push('beforeMethodTest');
        },
        testAfterMethod () {
          flows.push('afterMethodTest');
        }
      },
      hooks: {
        before: {
          all () {
            flows.push('hookBeforeAll');
          },

          listProperties: ['testBeforeMethod', 'testBeforeMethod']
        },
        after: {
          listProperties: 'testAfterMethod'
        }
      },
      async started () {
        flows.push('started');
      },
      async closed () {
        flows.push('closed');
      }
    });

    // start
    await service.start();

    // non-existed action
    try {
      await service.call('demo.fail');
      assert.fail('it should fail action');
    } catch (err) {
      expect(err).to.has.property('message', 'Invalid action address "demo.fail"');
    }

    // list this properties
    const localProperties = await service.call('demo.listProperties');
    expect(localProperties).to.not.contain.members(['start', 'close']);

    const publicProperties = Object.keys(service);
    expect(publicProperties).to.contain.members(['start', 'close']);

    // close
    await service.close();

    expect(flows).to.has.members([
      'started',
      'hookBeforeAll',
      'beforeMethodTest',
      'beforeMethodTest',
      'listProperties',
      'afterMethodTest',
      'closed'
    ]);
  });

  it('should error create service', async () => {
    try {
      createService({}, { name: 'demo', actions: { test () { } }, hooks: { before: { test: 'noMethod' } } });
      assert.fail('it should fail');
    } catch (err) {
      expect(err).to.has.property('message', 'Hook method "noMethod" is not found.');
    }

    try {
      createService({}, { name: 'demo', methods: { name () { } } });
      assert.fail('it should fail');
    } catch (err) {
      expect(err).to.has.property('message', 'Conflict method name "name"');
    }

    try {
      const context = {};
      createService(context, { name: 'demo', actions: { name () { } } });
      createService(context, { name: 'demo', actions: { name () { } } });
      assert.fail('it should fail');
    } catch (err) {
      expect(err).to.has.property('message', 'Conflict action name "demo.name"');
    }
  });

  it('should access global variable', async () => {
    const context = {};

    const fooService = createService(context, { name: 'foo', actions: { put() { this.globals['name'] = 'rugo'; }, error(){ this.globals = {} }}});
    const barService = createService(context, { name: 'bar', actions: { get() { return this.globals; }}});

    await fooService.call('foo.put');
    const res = await barService.call('bar.get');

    expect(res).to.has.property('name', 'rugo');

    try {
      await fooService.call('foo.error');
      assert.fail('should throw error');
    } catch(errs) {
      expect(errs[0]).to.has.property('message', `Cannot assign to read only property 'globals' of object '#<Object>'`);
    }
  });
});
