import { Role } from '../ApiFactory.js';
import { ActivityConstructor } from './Activity.js';
import { Element } from './Element.js';
import { Call, CallArgs, Context } from './types.js';

export abstract class Player extends Element {
  abstract readonly role: Role;
  abstract readonly routine: ActivityConstructor[];

  #runid = 0;
  #inbox: Omit<Call, 'player'>[] = [];
  #outbox: Call[] = [];

  async run(): Promise<void> {
    this.#runid += 1;

    const currentInbox = [...this.#inbox];
    this.#inbox = [];

    for (const [n, { Activity: Act, args }] of currentInbox.entries()) {
      const activity = new Act(`${this.id}:act(${this.#runid}):inbox(${n})`, this.context);
      await activity.run(this, args);
    }

    for (const [n, Act] of this.routine.entries()) {
      const activity = new Act(`${this.id}:act(${this.#runid}):routine(${n})`, this.context);
      await activity.run(this);
    }
  }

  sendToOne(
    playerType: PlayerConstructor,
    activity: ActivityConstructor,
    args: CallArgs = {},
  ): void {
    this.#outbox.push({
      player: {
        kind: 'one',
        type: playerType.name,
      },
      Activity: activity,
      args,
    });
  }

  sendToAll(
    playerType: PlayerConstructor,
    activity: ActivityConstructor,
    args: CallArgs = {},
  ): void {
    this.#outbox.push({
      player: {
        kind: 'all',
        type: playerType.name,
      },
      Activity: activity,
      args,
    });
  }

  receive(call: Omit<Call, 'player'>): void {
    this.#inbox.push(call);
  }

  outbox(): Call[] {
    const currentOutbox = [...this.#outbox];
    this.#outbox = [];
    return currentOutbox;
  }
}

export type PlayerConstructor = { name: string; new (id: string, context: Context): Player };
