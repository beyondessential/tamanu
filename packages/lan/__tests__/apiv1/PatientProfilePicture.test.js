import { createDummyPatient, createDummyEncounter, randomReferenceId } from 'shared/demoData/patients';
import { createTestContext, extendExpect } from '../utilities';

async function uploadDummyProfilePicture(models, patientId) {
  const program = await models.Program.create({ name: "pfp-program" });

  const survey = await models.Survey.create({
    programId: program.id,
    name: "pfp-survey",
  });

  const dataElement = await models.ProgramDataElement.create({
    name: "Profile picture",
    defaultText: "abcd",
    code: "ProfilePhoto",
    type: "Photo",
  });

  const component = await models.SurveyScreenComponent.create({
    dataElementId: dataElement.id,
    surveyId: survey.id,
    componentIndex: 0,
    text: "Photo",
    screenIndex: 0,
  });

  const encounter = await models.Encounter.create({
    ...(await createDummyEncounter(models)),
    patientId,
  });

  const response = await models.SurveyResponse.createWithAnswers({
    patientId,
    encounterId: encounter.id,
    surveyId: survey.id,
    answers: {
      [dataElement.id]: '12345',
    },
  })

  return dataElement;
}

describe('Patient profile picture', () => {
  let app = null;
  let baseApp = null;
  let models = null;
  let patient = null;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
  });

  // Disabling this as the endpoint currently expects a real remote to exist
  xit('should retrieve a profile picture where one exists', async () => {
    const patient = await models.Patient.create(await createDummyPatient(models));
    await uploadDummyProfilePicture(models, patient.id);

    const result = await app.get(`/v1/patient/${patient.id}/profilePicture`);
    expect(result).toHaveSucceeded();

    expect(result.body).toHaveProperty('data');
    expect(result.body).toHaveProperty('mimeType');
  });

  it('should send a placeholder picture when no real one is available', async () => {
    const otherPatient = await models.Patient.create(await createDummyPatient(models));

    const result = await app.get(`/v1/patient/${otherPatient.id}/profilePicture`);
    expect(result).toHaveRequestError();
  });
});
