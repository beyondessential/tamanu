// TODO (TAN-1529): import this from the spreadsheet once possible
import data from './data.json';

export default {
  run: async store => {
    const { Program, Survey, SurveyScreenComponent, ProgramDataElement } = store.models;
    const { program: programData, survey: surveyData, questions: questionsData } = data;
    const [program] = await Program.upsert(programData, { returning: true });
    const { id: programId } = program;

    const [survey] = await Survey.upsert(
      {
        id: `${programId}-${surveyData.code}`,
        programId,
        ...surveyData,
      },
      { returning: true },
    );
    const { id: surveyId } = survey;

    let componentIndex = 0;
    let screenIndex = 0;
    const questions = [];
    for (const questionData of questionsData) {
      const {
        calculation,
        code,
        config = '',
        detail = '',
        name,
        newScreen,
        options: defaultOptions,
        text: defaultText,
        type,
        validationCriteria = '',
        visibilityCriteria = '',
      } = questionData;
      if (newScreen) {
        screenIndex += 1;
        componentIndex = 0;
      }

      const [dataElement] = await ProgramDataElement.upsert(
        {
          id: `pde-${code}`,
          code,
          name,
          defaultText,
          defaultOptions,
          type,
          surveyId,
        },
        { returning: true },
      );

      const [component] = await SurveyScreenComponent.upsert(
        {
          id: `${surveyId}-${code}`,
          text: '',
          screenIndex,
          componentIndex,
          visibilityCriteria,
          validationCriteria,
          detail,
          config,
          calculation,
          dataElementId: dataElement.id,
          surveyId,
        },
        { returning: true },
      );

      questions.push([dataElement, component]);
      componentIndex += 1;
    }

    return { program, survey, questions };
  },
};
