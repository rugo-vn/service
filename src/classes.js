class RawData {
  constructor(initData) {
    for (const key in initData) this[key] = initData[key];
  }
}

export class Exception {
  constructor(err) {
    this.name = err.name;
    this.message = err.message;
    this.stack = err.stack;
    this.data = err.data;
  }
}

export class HttpResponse {
  constructor(data) {
    this.status = data.status ? data.status : data.body ? 200 : 404;
    this.headers = data.headers || {};
    this.body = data.body;
  }
}
