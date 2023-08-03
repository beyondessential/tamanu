import { FetchImplementation, setFetchImplementation } from '@tamanu/api-client';
import { fetch } from 'undici';
setFetchImplementation(fetch as unknown as FetchImplementation);

import { ApiFactory } from './ApiFactory.js';
import { Game } from './board/Game.js';
import { Context, makeContext } from './board/types.js';
import { Receptionist } from './players/Receptionist.js';
import { Nurse } from './players/Nurse.js';

class MakePatientsGame extends Game {
  #patientsTarget: number;

  constructor(amount: number, context: Context) {
    super(MakePatientsGame.name, context);
    this.#patientsTarget = amount;
    this.addPlayer(Receptionist, 2);
    this.addPlayer(Nurse, 10);
  }

  async stopCondition(): Promise<boolean> {
    const api = await this.context.api.as('admin');
    const patients = (await api.get('patient', { countOnly: true })) as { count: number };
    console.log(`Patients: ${patients.count}/${this.#patientsTarget}`);
    return patients.count >= this.#patientsTarget;
  }
}

(async () => {
  const game = new MakePatientsGame(
    200,
    makeContext({ api: new ApiFactory('http://localhost:3000', 'http://localhost:4000') }),
  );
  await game.run();
})().catch(console.error);
