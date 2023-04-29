import { expect } from 'chai';
import * as Classes from '../src/make.js';

class Person {
  #id;

  constructor(initData) {
    for (const key in initData) this[key] = initData[key];
    this.#id = 10;
  }
}
describe('Constructor test', function () {
  it('should same and differ', async () => {
    const nonObj = { age: 10 };
    const conObj = new Person({ age: 10 });

    expect(nonObj).is.deep.eq(conObj);
    expect(nonObj.constructor.name).is.not.eq(conObj.constructor.name);
  });

  it('should make type', async () => {
    expect(Classes.makeBoolean(false)).to.be.eq(false);
    expect(Classes.makeObject({ a: 1, b: 2, c: 3 })).to.be.deep.eq({
      a: 1,
      b: 2,
      c: 3,
    });
  });
});
