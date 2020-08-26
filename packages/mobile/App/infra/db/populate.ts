import { dummyPrograms } from '~/dummyData/programs';

export async function needsInitialPopulation(models): boolean {
  // TODO: this should check against something more reasonable
  const allPrograms = await models.Program.find({});
  if(allPrograms.length === 0) {
    return true;
  }

  return false;
}

async function importComponent(models, data) {
  const { SurveyScreenComponent, ProgramDataElement } = models;

  const pde = await ProgramDataElement.create({
    code: data.id,
    type: data.type,
    indicator: data.indicator,
    defaultText: data.text,
  });

  const component = await SurveyScreenComponent.create({
    dataElement: pde.id,
    survey: data.survey.id,
    screenIndex: 0,
    componentIndex: data.componentIndex,
  });

  return component;
}

async function importSurvey(models, data) {
  const { Survey } = models;
  const { 
    components,
    ...surveyData
  } = data;
  const s = await Survey.create(surveyData);
  
  await Promise.all(components.map((componentData, index) => {
    return importComponent(models, {
      ...componentData,
      survey: s,
      componentIndex: index,
    });
  }));

  return s;
}

async function importProgram(models, data) {
  const { Program } = models;

  const { 
    surveys,
    ...programData
  } = data;
  const p = await Program.create(programData);

  await Promise.all(surveys.map(async surveyData => {
    const s = await importSurvey(models, {
      ...surveyData,
      program: p.id,
    });

    return s;
  }));

  return p;
}

export async function populateInitialData(models) {
  console.log("Populating initial database");

  // TODO: should load from a fixture or trigger an initial sync
  const programs = await Promise.all(
    dummyPrograms.map(data => {
      return importProgram(models, data);
    })
  );
}
