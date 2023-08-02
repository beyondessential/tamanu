import { Element } from "./Element.js";
import { Player, PlayerConstructor } from "./Player.js";

export class Game extends Element {
  round = 0;
  #players: Map<string, Player[]> = new Map();

  addPlayer(Play: PlayerConstructor, n = 1): void {
    if (this.round > 0) {
      throw new Error('Game has started, cannot add more players');
    }

    for (let i = 0; i < n; i += 1) {
      const players = this.#players.get(Play.name) ?? [];
      const player = new Play(`${this.id}-${Play.name}(${players.length})`, this.context);
      players.push(player);
      this.#players.set(Play.constructor.name, players);
    }
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
