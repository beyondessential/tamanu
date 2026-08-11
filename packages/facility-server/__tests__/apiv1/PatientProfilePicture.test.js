import { Readable } from 'node:stream';
import { createHash } from 'node:crypto';

import { BLOB_AVAILABILITY_STATES } from '@tamanu/constants';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';

const hashOf = content => `sha256:${createHash('sha256').update(content).digest('hex')}`;

async function uploadDummyProfilePicture(models, patientId, attachmentId) {
  const program = await models.Program.create({ name: 'pfp-program' });

  const survey = await models.Survey.create({
    programId: program.id,
    name: 'pfp-survey',
  });

  const dataElement = await models.ProgramDataElement.create({
    name: 'Profile picture',
    defaultText: 'abcd',
    code: 'ProfilePhoto',
    type: 'Photo',
  });

  await models.SurveyScreenComponent.create({
    dataElementId: dataElement.id,
    surveyId: survey.id,
    componentIndex: 0,
    text: 'Photo',
    screenIndex: 0,
  });

  const encounter = await models.Encounter.create({
    ...(await createDummyEncounter(models)),
    patientId,
  });

  await models.SurveyResponse.sequelize.transaction(() =>
    models.SurveyResponse.createWithAnswers({
      patientId,
      encounterId: encounter.id,
      surveyId: survey.id,
      answers: {
        [dataElement.id]: attachmentId,
      },
    }),
  );

  return dataElement;
}

describe('Patient profile picture', () => {
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;
  let uniqueSuffix = 0;

  const uniqueContent = () =>
    Buffer.from(`a profile photo captured on the facility ${(uniqueSuffix += 1)}`, 'utf8');

  // Stands in for central: local content is available without consulting it,
  // mirroring the real channel, so only the remote half is faked here.
  const setCentral = ({ holds = null } = {}) => {
    ctx.blobCache.setTransferChannel({
      availability: async (hash, { stat } = {}) => {
        const local = stat === undefined ? await ctx.blobStore.servableStat(hash) : stat;
        if (local) {
          return { availability: BLOB_AVAILABILITY_STATES.AVAILABLE, size: local.size };
        }
        if (holds && hashOf(holds) === hash) {
          return { availability: BLOB_AVAILABILITY_STATES.AWAITING_FETCH, size: holds.length };
        }
        return { availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD };
      },
      fetchFromCentral: async hash => {
        if (!holds || hashOf(holds) !== hash) {
          throw new Error(`central does not hold ${hash}`);
        }
        return await ctx.blobStore.put(Readable.from([holds]));
      },
    });
  };

  const makeAttachment = async (hash, size) =>
    await models.Attachment.create(
      fake(models.Attachment, { hash, data: null, type: 'image/jpeg', size }),
    );

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  // spec: ATCH
  // A profile picture is a survey photo answer, so it reads from the facility's
  // own store like any other attachment rather than through central.
  it('should retrieve a profile picture where one exists', async () => {
    const image = uniqueContent();
    const { hash } = await ctx.blobStore.put(Readable.from([image]));
    const attachment = await makeAttachment(hash, image.length);
    const patient = await models.Patient.create(await createDummyPatient(models));
    await uploadDummyProfilePicture(models, patient.id, attachment.id);
    setCentral();

    const result = await app.get(`/api/patient/${patient.id}/profilePicture`);
    expect(result).toHaveSucceeded();

    expect(result.body.data).toBe(image.toString('base64'));
    expect(result.body.mimeType).toBe('image/jpeg');
  });

  it('should resolve the bytes from central on a local miss and serve them', async () => {
    const image = uniqueContent();
    const attachment = await makeAttachment(hashOf(image), image.length);
    const patient = await models.Patient.create(await createDummyPatient(models));
    await uploadDummyProfilePicture(models, patient.id, attachment.id);
    setCentral({ holds: image });

    expect(await ctx.blobStore.stat(hashOf(image))).toBeNull();

    const result = await app.get(`/api/patient/${patient.id}/profilePicture`);
    expect(result).toHaveSucceeded();
    expect(result.body.data).toBe(image.toString('base64'));
  });

  // spec: ATCH — an existing file awaiting its content, rather than a response
  // that carries no data and says nothing about why.
  it('should present content neither server holds as awaiting its content', async () => {
    const image = uniqueContent();
    const attachment = await makeAttachment(hashOf(image), image.length);
    const patient = await models.Patient.create(await createDummyPatient(models));
    await uploadDummyProfilePicture(models, patient.id, attachment.id);
    setCentral();

    const result = await app.get(`/api/patient/${patient.id}/profilePicture`);
    expect(result).toHaveStatus(202);
    expect(result.body.availability).toBe(BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD);
    expect(result.body.data).toBeUndefined();
  });

  // A legacy attachment holds its bytes on central and has no hash, so it is read
  // through rather than resolved locally. Central answering with no data is the
  // same awaiting-content state, and used to reach the client as a 200 carrying
  // an undefined `data`.
  it('should present a legacy attachment central cannot supply as awaiting its content', async () => {
    const attachment = await models.Attachment.create(
      fake(models.Attachment, { hash: null, data: null, type: 'image/jpeg', size: 0 }),
    );
    const patient = await models.Patient.create(await createDummyPatient(models));
    await uploadDummyProfilePicture(models, patient.id, attachment.id);

    const result = await app.get(`/api/patient/${patient.id}/profilePicture`);
    expect(result).toHaveStatus(202);
    expect(result.body.data).toBeUndefined();
  });

  it('should send a placeholder picture when no real one is available', async () => {
    const otherPatient = await models.Patient.create(await createDummyPatient(models));

    const result = await app.get(`/api/patient/${otherPatient.id}/profilePicture`);
    expect(result).toHaveRequestError();
  });
});
