import { utils } from 'xlsx';

import { fake } from '@tamanu/fake-data/fake';
import { PROGRAM_DATA_ELEMENT_TYPES, SURVEY_TYPES } from '@tamanu/constants';

import { importSurveyResponses } from '../../app/admin/surveyResponsesImporter/importSurveyResponses';
import { createTestContext } from '../utilities';

// the importer can take a little while
jest.setTimeout(60000);

const buildWorkbook = rows => {
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, utils.aoa_to_sheet(rows), 'Survey Responses');
  return workbook;
};

describe('Survey responses import', () => {
  let ctx;
  let models;
  let patient;
  let user;
  let department;
  let location;
  let dataElement;
  let selectWithZeroDataElement;
  let selectWithoutZeroDataElement;

  const surveyCode = 'survey-responses-import-test';
  const questionCode = 'srit-number-question';
  const selectSurveyCode = 'survey-responses-import-select-test';
  const selectWithZeroCode = 'srit-select-with-zero-option';
  const selectWithoutZeroCode = 'srit-select-without-zero-option';

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;

    patient = await models.Patient.create(fake(models.Patient));
    user = await models.User.create(fake(models.User));
    const facility = await models.Facility.create(fake(models.Facility));
    department = await models.Department.create(
      fake(models.Department, { facilityId: facility.id }),
    );
    location = await models.Location.create(fake(models.Location, { facilityId: facility.id }));

    const program = await models.Program.create(fake(models.Program));
    const survey = await models.Survey.create(
      fake(models.Survey, {
        code: surveyCode,
        surveyType: SURVEY_TYPES.PROGRAMS,
        programId: program.id,
      }),
    );
    dataElement = await models.ProgramDataElement.create(
      fake(models.ProgramDataElement, {
        code: questionCode,
        type: PROGRAM_DATA_ELEMENT_TYPES.NUMBER,
      }),
    );
    await models.SurveyScreenComponent.create(
      fake(models.SurveyScreenComponent, {
        dataElementId: dataElement.id,
        surveyId: survey.id,
        validationCriteria: JSON.stringify({ mandatory: true }),
      }),
    );

    const selectSurvey = await models.Survey.create(
      fake(models.Survey, {
        code: selectSurveyCode,
        surveyType: SURVEY_TYPES.PROGRAMS,
        programId: program.id,
      }),
    );
    selectWithZeroDataElement = await models.ProgramDataElement.create(
      fake(models.ProgramDataElement, {
        code: selectWithZeroCode,
        type: PROGRAM_DATA_ELEMENT_TYPES.SELECT,
        defaultOptions: null,
      }),
    );
    await models.SurveyScreenComponent.create(
      fake(models.SurveyScreenComponent, {
        dataElementId: selectWithZeroDataElement.id,
        surveyId: selectSurvey.id,
        validationCriteria: null,
        visibilityCriteria: null,
        options: JSON.stringify({ 0: 'Zero', 1: 'One' }),
      }),
    );
    selectWithoutZeroDataElement = await models.ProgramDataElement.create(
      fake(models.ProgramDataElement, {
        code: selectWithoutZeroCode,
        type: PROGRAM_DATA_ELEMENT_TYPES.SELECT,
        defaultOptions: null,
      }),
    );
    await models.SurveyScreenComponent.create(
      fake(models.SurveyScreenComponent, {
        dataElementId: selectWithoutZeroDataElement.id,
        surveyId: selectSurvey.id,
        validationCriteria: null,
        visibilityCriteria: null,
        options: JSON.stringify({ yes: 'Yes', no: 'No' }),
      }),
    );
  });

  afterEach(async () => {
    await models.SurveyResponseAnswer.truncate();
    await models.SurveyResponse.truncate();
  });

  afterAll(async () => {
    await ctx.close();
  });

  const doImport = async workbook => {
    const errors = [];
    const stats = await models.SurveyResponse.sequelize.transaction(() =>
      importSurveyResponses(workbook, {
        errors,
        log: { debug: () => {} },
        models,
      }),
    );
    return { errors, stats };
  };

  it('accepts a numeric zero answer for a mandatory number question', async () => {
    const workbook = buildWorkbook([
      ['patientId', 'submittedBy', 'departmentId', 'locationId', 'surveyCode', questionCode],
      [patient.id, user.id, department.id, location.id, surveyCode, 0],
    ]);

    const { errors } = await doImport(workbook);

    expect(errors).toEqual([]);
    const answer = await models.SurveyResponseAnswer.findOne({
      where: { dataElementId: dataElement.id },
    });
    expect(answer).toMatchObject({ body: '0' });
  });

  it('still rejects an empty mandatory answer', async () => {
    const workbook = buildWorkbook([
      ['patientId', 'submittedBy', 'departmentId', 'locationId', 'surveyCode', questionCode],
      [patient.id, user.id, department.id, location.id, surveyCode, null],
    ]);

    const { errors } = await doImport(workbook);

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Value is mandatory');
    expect(await models.SurveyResponseAnswer.count()).toEqual(0);
  });

  it('rejects an unparseable value for a number question', async () => {
    const workbook = buildWorkbook([
      ['patientId', 'submittedBy', 'departmentId', 'locationId', 'surveyCode', questionCode],
      [patient.id, user.id, department.id, location.id, surveyCode, 'not-a-number'],
    ]);

    const { errors } = await doImport(workbook);

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('is not a valid number');
    expect(await models.SurveyResponseAnswer.count()).toEqual(0);
  });

  it('accepts a numeric zero answer for a select question with a "0" option', async () => {
    const workbook = buildWorkbook([
      ['patientId', 'submittedBy', 'departmentId', 'locationId', 'surveyCode', selectWithZeroCode],
      [patient.id, user.id, department.id, location.id, selectSurveyCode, 0],
    ]);

    const { errors } = await doImport(workbook);

    expect(errors).toEqual([]);
    const answer = await models.SurveyResponseAnswer.findOne({
      where: { dataElementId: selectWithZeroDataElement.id },
    });
    expect(answer).toMatchObject({ body: '0' });
  });

  it('rejects a numeric zero answer for a select question without a "0" option', async () => {
    const workbook = buildWorkbook([
      [
        'patientId',
        'submittedBy',
        'departmentId',
        'locationId',
        'surveyCode',
        selectWithoutZeroCode,
      ],
      [patient.id, user.id, department.id, location.id, selectSurveyCode, 0],
    ]);

    const { errors } = await doImport(workbook);

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Value must be one of');
    expect(await models.SurveyResponseAnswer.count()).toEqual(0);
  });
});
