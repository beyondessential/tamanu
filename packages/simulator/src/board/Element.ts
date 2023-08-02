import { Context } from "./types.js";

export abstract class Element {
  readonly id: string;
  context: Context;

  constructor(id: string, context: Context) {
    this.id = `${this.constructor.name}-${id}`;
    this.context = context;
  }

  abstract run(): Promise<void>;
}
