import { clone, mergeDeepLeft } from 'ramda';
import { createService, loadServiceConfig } from './service.js';

const brokerConfig = {
  name: '$broker',
  methods: {
    init(brokerContext){
      this.services ||= [];
      this.brokerContext = brokerContext;
    },

    createService(serviceConfig) {
      const settings = clone(this.settings);

      for (let key in settings){
        if (key[0] === '_')
          delete settings[key];
      }

      const service = createService(this.brokerContext, mergeDeepLeft(serviceConfig, { settings }));
      this.services.push(service);

      return service;
    },

    async loadServices() {
      for (let location of this.settings._services || []){
        let serviceConfig = await loadServiceConfig(location);
        this.createService(serviceConfig);
      }
    }
  },

  async started() {
    for (let service of this.services){
      await service.start();
    }
  },

  async closed() {
    for (let service of this.services){
      await service.close();
    }
  }
};

export const createBroker = function(settings = {}) {
  const brokerContext = {};

  const brokerService = createService(brokerContext, mergeDeepLeft(brokerConfig, { settings }));
  brokerService.init(brokerContext);

  return brokerService;
}