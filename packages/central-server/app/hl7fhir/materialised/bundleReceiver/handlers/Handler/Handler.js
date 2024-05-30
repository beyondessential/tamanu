import { bundlesCommon } from './schema';

export class Handler {
  static init(schema) {
  }

  static HANDLER_NAME = 'Handler';
  static schema = bundlesCommon;

  // fetch upstream and necessary includes, diff and update
  static async matchBundle() {
    console.log(`checking is valid ${this.HANDLER_NAME}`);
    return false;
  }

  // fetch upstream and necessary includes, diff and update

  static async validate() {
    console.log(`checking is valid ${this.HANDLER_NAME}`);
    return false;
  }
}
