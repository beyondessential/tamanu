import { Activity, ActivityConstructor } from "./Activity.js";
import { Element } from "./Element.js";
import { Call, Context } from "./types.js";

export abstract class Player extends Element {
  abstract routine(): ActivityConstructor[];

  #runid = 0;
  #inbox: Activity[] = [];
  #outbox: Call[] = [];

  async run(): Promise<void> {
    this.#runid += 1;

    const currentInbox = [...this.#inbox];
    this.#inbox = [];

    for (const activity of currentInbox) {
      await activity.run();
    }

    const routine = this.routine();
    for (const [n, Act] of routine.entries()) {
      const activity = new Act(`${this.id}-${this.#runid}-routine(${n})`, this.context);
      await activity.run();
    }
  }

  #callIds = new Map<string, number>();
  callId(reason: string): string {
    const n = this.#callIds.get(reason) ?? 0;
    this.#callIds.set(reason, n + 1);
    return `${this.id}-${this.#runid}-call(${reason},${n})`;
  }

  sendToOne(playerType: string, activity: Activity): void {
    this.#outbox.push({
      player: {
        kind: 'one',
        type: playerType,
      },
      activity,
    });
  }

  sendToAll(playerType: string, activity: Activity): void {
    this.#outbox.push({
      player: {
        kind: 'all',
        type: playerType,
      },
      activity,
    });
  }

  receive(activity: Activity): void {
    this.#inbox.push(activity);
  }

  outbox(): Call[] {
    const currentOutbox = [...this.#outbox];
    this.#outbox = [];
    return currentOutbox;
  }
}

export type PlayerConstructor = { new (id: string, context: Context): Player };
