import { TamanuApi } from '@tamanu/api-client';
import { Game } from './board/Game.js';
import { Player } from './board/Player.js';
import { Activity, ActivityConstructor } from './board/Activity.js';
import { makeContext } from 'board/types.js';

class Login extends Activity {
  async gather(): Promise<void> {
    //
  }

  async act(): Promise<void> {
    //
  }
}

class Doctor extends Player {
  routine(): ActivityConstructor[] {
    return [Login];
  }
}

// TODO: host argument instead of pulling from config, then override in desktop
const game = new Game('game', makeContext({ api: new TamanuApi('game', '1.2.3', 'no') }));
game.addPlayer(Doctor, 10);
