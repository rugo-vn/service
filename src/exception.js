export class RugoError extends Error {
  constructor(message){
    super(message);

    this.status = 400;
    this.title = this.constructor.name;
    this.detail = message || 'Something wrong.';
  }
}

export class ServiceError extends RugoError {
  constructor(message) {
    super(message);

    this.status = 500;
    this.source = { pointer: '' };
  }
}