export const importProgram = async (
  { Program, Survey, SurveyScreenComponent, ProgramDataElement },
  { program: programData, survey: surveyData, questions: questionsData },
) => {
  const program = await Program.upsert(programData);
  const { id: programId } = program;

  const survey = await Survey.upsert({
    id: `${programId}-${surveyData.code}`,
    programId,
    ...surveyData,
  });
  const { id: surveyId } = survey;

  let componentIndex = 0;
  let screenIndex = 0;
  const questions = [];
  for (const data of questionsData) {
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
    } = data;
    if (newScreen) {
      screenIndex += 1;
      componentIndex = 0;
    }

    const dataElement = await ProgramDataElement.upsert({
      id: `pde-${code}`,
      code,
      name,
      defaultText,
      defaultOptions,
      type,
      surveyId,
    });

    const component = await SurveyScreenComponent.upsert({
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
    });

    questions.push([dataElement, component]);
    componentIndex += 1;
  }

  return { program, survey, questions };
};
