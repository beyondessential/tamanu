import { TamanuApi } from '@tamanu/api-client';

interface Context {
  api: TamanuApi;
}

abstract class GameElement {
  readonly id: string;
  context: Context;

  constructor(id: string, context: Context) {
    this.id = id;
    this.context = context;
  }

  abstract run(): Promise<void>;
}

abstract class Activity extends GameElement {
  abstract gather(): Promise<void>;
  abstract act(): Promise<void>;
  abstract call(): Promise<void>;

  async run(): Promise<void> {
    await this.gather();
    await this.act();
    await this.call();
  }
}

interface OneOf {
  kind: 'one';
  type: string;
}

interface AllOf {
  kind: 'all';
  type: string;
}

interface Call {
  player: OneOf | AllOf;
  activity: Activity;
}

abstract class Player extends GameElement {
  abstract routine(): Activity[];

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
    for (const activity of routine) {
      await activity.run();
    }
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

abstract class Game extends GameElement {
  round = 0;
  #players: Map<string, Player[]> = new Map();

  addPlayer(player: Player): void {
    if (this.round > 0) {
      throw new Error('Game has started, cannot add more players');
    }

    const players = this.#players.get(player.constructor.name) ?? [];
    players.push(player);
    this.#players.set(player.constructor.name, players);
  }

  async run(): Promise<void> {
    this.round += 1;

    const players = [...this.#players.values()].flat();
    for (const player of players) {
      await player.run();
    }

    const calls = players.flatMap((player) => player.outbox());
    for (const { player, activity } of calls) {
      if (player.kind === 'one') {
        const targets = this.#players.get(player.type);
        if (!targets) {
          throw new Error(`Unknown player type ${player.type}`);
        }

        const target = targets[Math.floor(Math.random() * targets.length)];
        target.receive(activity);
      } else if (player.kind === 'all') {
        const targets = this.#players.get(player.type);
        if (!targets) {
          throw new Error(`Unknown player type ${player.type}`);
        }

        for (const target of targets) {
          target.receive(activity);
        }
      }
    }
  }
}

class NewGame extends Game {}

new NewGame('game', { api: new TamanuApi('game', '1.2.3', 'no') });
