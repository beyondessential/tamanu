/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { dummyPrograms } from '~/dummyData/programs';
import { generatePatient } from '~/dummyData/patients';
import { ISurveyScreenComponent, ISurvey, IProgram, IPatient } from '~/types';

export async function needsInitialPopulation(models): Promise<boolean> {
  // TODO: this should check against something more reasonable
  const allPrograms = await models.Program.find({});
  if (allPrograms.length === 0) {
    return true;
  }

  return false;
}

async function importComponent(models, data): Promise<ISurveyScreenComponent> {
  const { SurveyScreenComponent, ProgramDataElement } = models;

  const pde = await ProgramDataElement.create({
    code: data.id,
    type: data.type,
    indicator: data.indicator,
    defaultText: data.text,
    defaultOptions: data.options,
  });

  const component = await SurveyScreenComponent.create({
    dataElement: pde.id,
    survey: data.survey.id,
    screenIndex: 0,
    componentIndex: data.componentIndex,
  });

  return component;
}

async function importSurvey(models, data): Promise<ISurvey> {
  const { Survey } = models;
  const { components, ...surveyData } = data;
  const s = await Survey.create(surveyData);

  await Promise.all(
    components.map((componentData, index) => importComponent(models, {
      ...componentData,
      survey: s,
      componentIndex: index,
    })),
  );

  return s;
}

async function importProgram(models, data): Promise<IProgram> {
  const { Program } = models;

  const { surveys, ...programData } = data;
  const p = await Program.create(programData);

  await Promise.all(
    surveys.map(async surveyData => {
      const s = await importSurvey(models, {
        ...surveyData,
        program: p.id,
      });

      return s;
    }),
  );

  return p;
}

async function importPatient(models, data): Promise<IPatient> {
  return models.Patient.create(data);
}

export async function populateInitialData(models): Promise<void> {
  console.log('Populating initial database');

  // TODO: should load from a fixture or trigger an initial sync
  const programs = await Promise.all(
    dummyPrograms.map(data => importProgram(models, data)),
  );

  const dummyPatients = new Array(15).fill(0).map(x => generatePatient());
  const patients = await Promise.all(
    dummyPatients.map(data => importPatient(models, data)),
  );
}
