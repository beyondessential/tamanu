import { Element } from './Element.js';
import { Player, PlayerConstructor } from './Player.js';

export abstract class Game extends Element {
  round = 0;
  #players: Map<string, Player[]> = new Map();

  abstract stopCondition(): Promise<boolean>;

  addPlayer(Play: PlayerConstructor, n = 1): void {
    if (this.round > 0) {
      throw new Error('Game has started, cannot add more players');
    }

    for (let i = 0; i < n; i += 1) {
      const players = this.#players.get(Play.name) ?? [];
      const player = new Play(`${players.length}`, this.context);
      players.push(player);
      this.#players.set(Play.name, players);
    }
  }

  async runRound(): Promise<void> {
    this.round += 1;
    console.time(`Round ${this.round}`);

    const players = [...this.#players.values()].flat();
    console.debug(`Running ${players.length} players simultaneously`);
    await Promise.all(players.map((player) => player.run()));

    console.debug('Collecting outboxes');
    const calls = players.flatMap((player) => player.outbox());
    if (calls.length > 0) {
      console.debug(`Distributing ${calls.length} calls`)
      for (const { player, Activity, args } of calls) {
        if (player.kind === 'one') {
          const targets = this.#players.get(player.type);
          if (!targets) {
            throw new Error(`Unknown player type ${player.type}`);
          }

          const target = targets[Math.floor(Math.random() * targets.length)];
          target.receive({ Activity, args });
        } else if (player.kind === 'all') {
          const targets = this.#players.get(player.type);
          if (!targets) {
            throw new Error(`Unknown player type ${player.type}`);
          }

          for (const target of targets) {
            target.receive({ Activity, args });
          }
        }
      }
    }

    console.timeEnd(`Round ${this.round}`);
  }

  async run(): Promise<void> {
    while (!(await this.stopCondition())) {
      await this.runRound();
    }
  }
}
