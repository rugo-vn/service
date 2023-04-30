# Rugo Service

Base for microservice system - Unit to build Rugo Platform.

## Concept

### Service

Service is a basic unit in Rugo Platform.

It can be write in any programming language.

It's an independent process managed by broker.

To spawn a service, do:

```js
import { spawnService } from '@rugo-vn/service';

const service = spawnService(definition);
```

Below is an example of `definition` structure:

```js
const serviceDefine = {
  /* required */
  name: 'service-name',
  exec: ['python', 'app.py'],

  /* optional */
  cwd: '/path/to/source/code',
  settings: {
    /* key-value settings */
  },
};
```

If your service managed by a centralization control service, you can pass config action of that service to settings:

```js
const serviceDefine = {
  name: 'service-name',
  settings: 'control.config' /* await config action from control service */,
};
```

To start the service, run:

```js
await service.start();
```

To stop the service, run:

```js
await service.stop();
```

### Communication

Between NodeJS process and Service process, we define a communication channel via UNIX socket.

```js
const socketA = await createSocket('/path/to/socket');

await socketA.close();
```

When `service.start` run, it will send a `start` action to the service and wait for response.

When `service.stop` run, it will send a `stop` action to the service and wait for response.

### Address

Each action have their own address by combinate service name and action name.

Addresses are unique and cannot be change over the platform.

### Broker

Broker is a container to host services. It will create communication environment between services.

Usage:

```js
import { createBroker } from '@rugo-vn/service';

const broker = await createBroker({
  port: /* tcp port for serve */
  endpoints: [ /* list of endpoint to connect */ ]
});
```

## Helper

To build a service in the process quickly, we introduced `helper`.

### NodeJS

```js
import { defineAction } from '@rugo-vn/service';

defineAction('actionName', async function (args, opts) {
  /* do something */
  return /* return something */;
});
```

## License

MIT.
