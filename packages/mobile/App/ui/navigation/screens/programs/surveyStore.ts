
class SurveyStore {

  constructor() {
    this.responses = [];
  }

  async getResponses(programId) {
    return this.responses;
  }

  async submitSurvey(program, answers) {
    this.responses.push({
      date: new Date(),
      name: `Resp ${Math.random().toFixed(3)}`, 
      program,
      answers,
    });
  }

}

export const surveyStore = new SurveyStore();
