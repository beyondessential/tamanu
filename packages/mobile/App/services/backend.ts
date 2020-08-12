import { isCalculated } from '/helpers/fields';

import { dummyPrograms } from '/root/App/dummyData/programs';

export class Backend {

  constructor() {
    this.responses = [];
  }

  async getPrograms() {
    return dummyPrograms;
  }

  async getResponses(surveyId): Promise {
    return this.responses;
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
