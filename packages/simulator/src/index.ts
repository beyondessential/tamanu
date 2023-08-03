import { FetchImplementation, setFetchImplementation } from '@tamanu/api-client';
import { fetch } from 'undici';
setFetchImplementation(fetch as unknown as FetchImplementation);

import { TamanuApi } from './TamanuApi.js';
import { Game } from './board/Game.js';
import { makeContext } from './board/types.js';
import { Receptionist } from './players/Receptionist.js';

class MakePatients extends Game {
  #patientsTarget: number;

  constructor(amount: number, ...rest: ConstructorParameters<typeof Game>) {
    super(...rest);
    this.#patientsTarget = amount;
    this.addPlayer(Receptionist, 2);
  }

  async stopCondition(): Promise<boolean> {
    const api = await this.context.api.as('admin');
    const patients = (await api.get('patient', { countOnly: true })) as { count: number };
    console.log(`Patients: ${patients.count}/${this.#patientsTarget}`);
    return patients.count >= this.#patientsTarget;
  }
}

(async () => {
  const game = new MakePatients(
    100,
    'game',
    makeContext({ api: new TamanuApi('http://localhost:3000', 'http://localhost:4000') }),
  );
  await game.run();
})().catch(console.error);
