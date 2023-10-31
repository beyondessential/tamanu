import { FetchImplementation, setFetchImplementation, RequestOptions } from '@tamanu/api-client';
import { fetch, RequestInfo } from 'undici';

let requestCounter = 0;
const countedFetch: FetchImplementation = async (url: Request | string | URL, config?: RequestOptions) => {
  requestCounter += 1;
  return fetch(url as unknown as RequestInfo, config);
};

setFetchImplementation(countedFetch);

import { ApiFactory } from './ApiFactory.js';
import { Game } from './board/Game.js';
import { Context, makeContext } from './board/types.js';
import { Receptionist } from './players/Receptionist.js';
import { Nurse } from './players/Nurse.js';

class MakeRequestsGame extends Game {
  requestsTarget: number;

  constructor(amount: number, context: Context) {
    super(MakeRequestsGame.name, context);
    this.requestsTarget = amount;
    this.addPlayer(Receptionist, 2);
    this.addPlayer(Nurse, 10);
  }

  // async stopCondition(): Promise<boolean> {
  //   const api = await this.context.api.as('admin');
  //   const patients = (await api.get('patient', { countOnly: true })) as { count: number };
  //   console.log(`Patients: ${patients.count}/${this.#patientsTarget}`);
  //   return patients.count >= this.#patientsTarget;
  // }

  async stopCondition(): Promise<boolean> {
    console.log(`Requests: ${requestCounter}/${this.requestsTarget}`);
    return requestCounter >= this.requestsTarget;
  }
}

const args = process.argv.slice(2);
const target = args[0] ? parseInt(args[0], 10) : null;

(async () => {
  const game = new MakeRequestsGame(
    target ?? 1000,
    makeContext({ api: new ApiFactory(
      process.env.SIMULATOR_CENTRAL ?? 'http://localhost:3000',
      process.env.SIMULATOR_FACILITY ?? 'http://localhost:4000',
    ) }),
  );
  await game.run();
  console.log('Made', requestCounter, 'requests');
})().catch(console.error);
