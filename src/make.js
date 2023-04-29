import { HttpResponse } from './classes.js';

const alias = (val) => val;

// default
export const makeNil = alias;
export const makeNumber = alias;
export const makeString = alias;
export const makeBoolean = alias;
export const makeObject = (val) => new Object(val);
export const makeArray = (val) => new Array(...val);

// custom
export const makeHttpResponse = (val) => new HttpResponse(val);
