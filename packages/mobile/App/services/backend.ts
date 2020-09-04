import { isCalculated } from '/helpers/fields';

import { dummyPrograms } from '~/dummyData/programs';
import { Database } from '~/infra/db';
import { needsInitialPopulation, populateInitialData } from '~/infra/db/populate';

export class Backend {

  constructor() {
    this.responses = [];
    this.initialised = false;
    this.models = Database.models;

    // keep a random id around so the provider can check if the backend object
    // was regenerated - this should only happens via live reload (ie in development mode)
    this.randomId = Math.random();
  }

  async initialise() {
    await Database.connect();
    const { models } = Database;
    if(await needsInitialPopulation(models)) {
      await populateInitialData(models);
    }
  }

}
