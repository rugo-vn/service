import { clone, mergeDeepLeft } from 'ramda';
import { createService, loadServiceConfig } from './service.js';
import colors from 'colors';

const brokerConfig = {
  name: '_broker',
  methods: {
    init (brokerContext) {
      this.services ||= [];
      this.brokerContext = brokerContext;
    },

    createService (serviceConfig) {
      const settings = clone(this.settings);

      for (const key in settings) {
        if (key[0] === '_') { delete settings[key]; }
      }

      const service = createService(this.brokerContext, mergeDeepLeft(serviceConfig, { settings }));
      this.services.push(service);

      return service;
    },

    async loadServices () {
      for (const location of this.settings._services || []) {
        const serviceConfig = await loadServiceConfig(location);
        this.createService(serviceConfig);
      }
    }
  },

  async started () {
    for (const service of this.services) {
      const ltime = Date.now();
      await service.start();
      this.logger.info(`Service ${colors.bold.green(service.name)} is started in ${colors.yellow(Date.now() - ltime + 'ms')}.`);
    }
  },

  async closed () {
    for (const service of this.services) {
      await service.close();
    }
  }
};

export const createBroker = function (settings = {}) {
  const brokerContext = {};

  const brokerService = createService(brokerContext, mergeDeepLeft(brokerConfig, { settings }));
  brokerService.init(brokerContext);

  return brokerService;
};
