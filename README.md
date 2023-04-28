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

## Concept

- `system` is an entire program, which run by node command.
- The `system` is devided into units, called `service`.
- `service` identity is `name`. It's a unique value.
- Super `service` to create, load and start other services, callced `broker`.
- Services were created by same `broker`, called `scope`.
- In `scope`, every services share a same variable called `globals`. You can access `globals` anywhere from the service through `this.globals`.
- In `scope`, every services can be execute functions from another service by `call` method, which can access anywhere in the service through `this.call`.
- In `service`, you can bind functions to `this`, these functions called `method`.
- `this.call` will call a function, called `action`. The call must have a `address` of the `action` you want to execute by format `<name>.<action>`.
- You can bind functions before, after and when error occur by `hooks`.

## Service Structure

```js
const serviceDefine = {
  name: /* ... */,
  settings: {
    /* ... */
  },
  methods: {
    async methodName(/* ... */) {
      /* ... */
    },

    /* ... */
  },
  actions: {
    async actionName(/* ... */) {
      /* ... */
    },

    /* ... */
  },
  hooks: {
    before: {
      async all(/* ... */) {
        /* ... */
      },

      /* ... */
    },

    after: {
      async all(/* ... */) {
        /* ... */
      },

      /* ... */
    },

    error: {
      async all(/* ... */) {
        /* ... */
      },

      /* ... */
    }
  },

  async started(/* ... */) {
    /* ... */
  },

  async closed(/* ... */) {
    /* ... */
  },
}
```

## Usage

```js
const settings = {
  _services: [
    '/path/to/service',
    /* ... */
  ],
  _globals: {
    /* global variables */
  },
};

const broker = createBroker(settings);

const service = broker.createService(serviceDefine);

await broker.loadServices();

await broker.start();
await broker.close();
```

## License

MIT.

<!--
## Hoạt động của service

### Tạo service

Service được tạo thông hoa hàm `createService` với tham số thứ nhất là một `context`, tham số thứ hai là một object định nghĩa service như đã trình bày ở phần trên.

```js
const context = {};

/* ... */

const service = createService(context, serviceDefine);
```

Hàm tạo này sẽ đóng gói các action trong object định nghĩa đi kèm các hook và ghi vào `context.addresses` với key là địa chỉ của action (`${tên service}.${tên action}`), để tiện cho việc gọi sau này. Đồng thời nó còn bind các hàm gọi, các hàm được định nghĩa trong `methods` cho service.

Các service có cùng `context` có thể gọi lẫn nhau.

Các service chia sẻ một biến toàn cầu `context.globals` tại `this.globals`.

### Bắt đầu và kết thúc

Sau khi service được tạo, ta có thể tiến hành chạy hàm `started` được định nghĩa bằng hàm `start`.

```js
await service.start();
```

Muốn kết thúc service bằng hàm `closed` được định nghĩa, ta chạy hàm `close`.

```js
await service.close();
```

### Gọi service

Bởi vì action không thể gọi trực tiếp, nên service chứa hàm gọi `call` để có thể gọi đến action của nó hoặc action của service khác.

Hàm gọi `call` yêu cầu 2 tham số, tham số thứ nhất là địa chỉ của action, tham số thứ 2 là một object args.

```js
const res = await service.call(address, args);
```

Về cơ bản `args` sẽ được gửi đến tham số thứ nhất của action, và kết quả `res` là kết quả trả về của action.

### Global variable

Biến toàn cầu được sử dụng để chia sẻ dữ liệu giữa các service một cách dễ dàng.

```js
const value = service.globals[key];

service.globals[key] = value;
```

### FileCursor

Việc trao đổi giữa các action thông qua hàm `call` sử dụng dữ liệu văn bản định dạng `json`. Do đó không thể gán một tập tin trực tiếp vô `args` được mà ta cần thay bằng một đối tượng `FileCursor`.

```js
const res = await service.call(address, {
  someName: new FileCursor(/* buffer/stream/file path/content of text file */),
});
```

Nếu action trả về một `FileCursor` thì kết quả cuối cung cũng là một `FileCursor`.

Từ `FileCursor` ta có thể lấy ra đường dẫn tạm thời của file thông qua phương thức `toPath`.

```js
fileCursor.toPath();
```

Methods:

- `fileCursor.toString()` or `fileCursor.toPath()` - to path string
- `fileCursor.toText()` - read content and make it string
= `fileCursor.toStream()` - make read stream

## Exception

Toàn bộ các exception của framework và các service nên/sẽ được đóng gói dưới dạng `RugoException`. Đây là một class chứa nhiều thông tin hơn class `Error` bình thường, ta có thể trực tiếp trả về các lỗi HTTP mà không cần xử lý phức tạp.

## Broker Service

_Source Service_

### Giới thiệu

Đây là một service đặc biệt, dùng để thiết lập môi trường cho các service hoạt động và tiến hành khởi tạo service.

### Actions

#### `services`

Trả về danh sách tên các service hoạt động trong môi trường của broker.

### Methods

#### `createService`

#### `loadService`

### Script

Ta có thể chạy script `./src/start.js` để tự động chạy broker service với settings được đọc từ tập tin `rugo.config.js` và file `.env`.

## Utils

### exec

Execute bash command.

### schema


 -->
