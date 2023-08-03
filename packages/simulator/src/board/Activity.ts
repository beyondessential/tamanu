import { Role } from '../ApiFactory.js';
import { Element } from './Element.js';
import { Player } from './Player.js';
import { CallArgs, Context } from './types.js';

export abstract class Activity extends Element {
  async gather(_gatherArgs: CallArgs): Promise<void> {}
  abstract act(role: Role): Promise<void>;
  async call(_player: Player): Promise<void> {}

  async run(player: Player, gatherArgs: CallArgs = {}): Promise<void> {
    await this.gather(gatherArgs);
    await this.act(player.role);
    await this.call(player);
  }
}

export type ActivityConstructor = { new (id: string, context: Context): Activity };
