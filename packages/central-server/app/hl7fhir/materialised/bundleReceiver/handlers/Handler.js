import { bundlesCommon } from '../schemas';

export class Handler {
  static init(schema) {
  }

  static HANDLER_NAME = 'parent handler';
  static schema = bundlesCommon;

  // fetch upstream and necessary includes, diff and update
  static async isValid(body) {
    console.log(`checking is valid ${this.HANDLER_NAME}`);
    // console.log({ schema: this.schema });
    return false;
    throw new Error('must be overridden');
  }
}
