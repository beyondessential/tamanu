import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
import { fake } from '@tamanu/fake-data/fake';
import { GENERIC_SURVEY_EXPORT_REPORT_ID } from '@tamanu/shared/reports';

import { createTestContext } from '../../utilities';

describe('Generic survey export line list report', () => {
  let baseApp;
  let app;
  let models;
  let ctx;
  let survey;

  const setupSurvey = async (answerBody) => {
    const {
      Facility,
      Location,
      Department,
      Patient,
      User,
      Encounter,
      Program,
      Survey,
      SurveyResponse,
      ProgramDataElement,
      SurveyScreenComponent,
      SurveyResponseAnswer,
    } = models;

    const facility = await Facility.create(fake(Facility));
    const location = await Location.create({
      ...fake(Location),
      facilityId: facility.id,
    });
    const department = await Department.create({
      ...fake(Department),
      facilityId: facility.id,
    });
    const examiner = await User.create(fake(User));
    const patient = await Patient.create(fake(Patient));
    const encounter = await Encounter.create({
      ...fake(Encounter),
      patientId: patient.id,
      departmentId: department.id,
      locationId: location.id,
      examinerId: examiner.id,
    });
    const program = await Program.create(fake(Program));
    const survey = await Survey.create({
      ...fake(Survey),
      programId: program.id,
    });
    const response = await SurveyResponse.create({
      ...fake(SurveyResponse),
      surveyId: survey.id,
      encounterId: encounter.id,
    });
    const dataElement = await ProgramDataElement.create({
      ...fake(ProgramDataElement),
    });
    await SurveyScreenComponent.create({
      ...fake(SurveyScreenComponent),
      responseId: response.id,
      dataElementId: dataElement.id,
      surveyId: survey.id,
    });
    await SurveyResponseAnswer.create({
      ...fake(SurveyResponseAnswer),
      dataElementId: dataElement.id,
      responseId: response.id,
      body: answerBody,
    });

    return { survey };
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    baseApp = ctx.baseApp;

    const surveyDetails = await setupSurvey();
    survey = surveyDetails.survey;
  });
  afterAll(() => ctx.close());
  disableHardcodedPermissionsForSuite();

  describe('Permissions', () => {
    it('does not throw forbidden error when there is sufficient permissions', async () => {
      const permissions = [
        ['run', 'StaticReport', GENERIC_SURVEY_EXPORT_REPORT_ID],
        ['read', 'Survey', survey.id],
      ];

      app = await baseApp.asNewRole(permissions);
      const result = await app.post(`/api/reports/${GENERIC_SURVEY_EXPORT_REPORT_ID}`).send({
        parameters: { surveyId: survey.id },
      });
      expect(result).toHaveSucceeded();
    });

    it('throws forbidden error when there is insufficient permissions', async () => {
      const permissions = [['run', 'StaticReport', GENERIC_SURVEY_EXPORT_REPORT_ID]];

      app = await baseApp.asNewRole(permissions);
      const result = await app.post(`/api/reports/${GENERIC_SURVEY_EXPORT_REPORT_ID}`).send({
        parameters: { surveyId: survey.id },
      });
      expect(result).toHaveStatus(403);
    });
  });
});
