import { Element } from "./Element.js";
import { Context } from "./types.js";

export abstract class Activity extends Element {
  async gather(): Promise<void> {}
  abstract act(): Promise<void>;
  async call(): Promise<void> {}

  async run(): Promise<void> {
    await this.gather();
    await this.act();
    await this.call();
  }
}

export type ActivityConstructor = { new (id: string, context: Context): Activity };
