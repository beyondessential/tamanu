/* eslint-disable @typescript-eslint/no-explicit-any */
import { isObject } from 'lodash';
import { Reader } from './Reader';

// quick utility to recurse through an object
// (to use with sanitising the config object)
function recurse(object: any, cb: (key: string, value: any)=>string, prefix: string = ''): any {
  return Object.entries(object).reduce((state, [k, v]) => {
    if (isObject(v)) {
      return { ...state, [k]: recurse(v, cb, `${prefix}${k}.`) };
    }
    return { ...state, [k]: cb(`${prefix}${k}`, v) };
  }, {});
}

function sanitise(object: any) : any {
  const re = /secret|key|password/i;
  return recurse(object, (k, v) => {
    if (!v) return v;
    if (!k.match(re)) return v;
    return '********';
  });
}

export class ConfigReader extends Reader {
  config: any;
  constructor(config: any) {
    super();
    this.config = sanitise(config);
  }

  async getSettings() {
    return this.config;
  }
}
