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

  const pde = new ProgramDataElement();
  Object.assign(pde, {
    code: data.id,
    type: data.type,
    indicator: data.indicator,
    defaultText: data.text,
  });
  await pde.save();

  const component = new SurveyScreenComponent();
  Object.assign(component, {
    dataElementId: pde.id,
    surveyId: data.surveyId,
    screenIndex: 0,
    componentIndex: data.componentIndex,
  });
  await component.save();

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
      surveyId: s.id,
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

  await Promise.all(surveys.map(surveyData => {
    return importSurvey(models, {
      ...surveyData,
      programId: p.id,
    });
  }));

  return p;
}

export async function populateInitialData(models) {
  const { Program } = models;

  console.log("Populating initial database");

  // TODO: should load from a fixture or trigger an initial sync
  const programs = dummyPrograms;

  await Promise.all(programs.map(data => {
    return importProgram(models, data);
  }));
}
