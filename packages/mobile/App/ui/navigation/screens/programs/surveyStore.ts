import { isCalculated } from '/helpers/fields';

class SurveyStore {

  constructor() {
    this.responses = [];
  }

  async getResponses(programId) {
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
          updatedAnswers[q.id] = q.calculation(updatedAnswers);
        } catch(e) {
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

export const surveyStore = new SurveyStore();
