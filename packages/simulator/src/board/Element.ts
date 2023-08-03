import { Context } from './types.js';

export abstract class Element {
  readonly id: string;
  context: Context;

  constructor(id: string, context: Context) {
    this.id = `${this.constructor.name}(${id})`;
    this.context = context;
    console.debug(`Created ${this.id}`);
  }

  abstract run(...args: unknown[]): Promise<void>;
}
