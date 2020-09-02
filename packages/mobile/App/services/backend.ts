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

  async getPrograms() {
    const { Program } = Database.models;

    const ps = await Program.find({});
    
    return ps.map(x => ({ ...x, questions: [] }));
  }

  async getResponses(surveyId): Promise {
    const responses = await Database.models.SurveyResponse.find({
      where: {
        survey: surveyId,
      },
      relations: ['encounter', 'survey', 'encounter.patient'],
    });
    return responses;
  }

  async submitSurvey(patient, program, answers) {
    const resultQuestion = program.questions.find(x => x.type === "Result");
    const updatedAnswers = {
      ...answers,
    };

    // determine all calculated answers
    program.questions
      .filter(q => isCalculated(q.type))
      .filter(q => q.calculation)
      .forEach(q => {
        try {
          const answer = q.calculation(patient, updatedAnswers);
          if(answer !== undefined && !Number.isNaN(answer)) {
            updatedAnswers[q.id] = answer;
          }
        } catch(e) {
          console.error(e);
          // TODO: handle bad calculation
        }
      });

    this.responses.push({
      date: new Date(),
      program,
      patient,
      answers: updatedAnswers,
    });
  }

}
