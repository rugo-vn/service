# Rugo Service

_Framework tạo service cho hệ thống microservice._

## Cấu trúc service

Một service được định nghĩa có cấu trúc như sau:

```js
{
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

## Hoạt động của service

### Tạo service

Service được tạo thông hoa hàm `createService` với tham số thứ nhất là một `context`, tham số thứ hai là một object định nghĩa service như đã trình bày ở phần trên.

```js
const context = {};

/* ... */

const service = createService(context, serviceDefine);
```

Hàm tạo này sẽ đóng gói các action trong object định nghĩa đi kèm các hook và ghi vào `context` với key là địa chỉ của action (`${tên service}.${tên action}`), để tiện cho việc gọi sau này. Đồng thời nó còn bind các hàm gọi, các hàm được định nghĩa trong `methods` cho service.

Các service có cùng `context` có thể gọi lẫn nhau.

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

## License
	
MIT.