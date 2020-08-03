
class SurveyStore {

  constructor() {
    this.responses = [];
  }

  async getResponses(programId) {
    return this.responses;
  }

  async submitSurvey(patient, program, answers) {
    this.responses.push({
      date: new Date(),
      program,
      patient,
      answers,
    });
  }

}

export const surveyStore = new SurveyStore();
