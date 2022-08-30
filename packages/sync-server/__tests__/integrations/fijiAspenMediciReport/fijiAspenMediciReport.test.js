import { parseISO, subDays } from 'date-fns';
import config from 'config';

import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from 'sync-server/__tests__/utilities';

const { host } = config.integrations.fijiVrs;

describe('fijiAspenMediciReport', () => {
  let ctx;
  let app;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    app = await ctx.baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  describe('success', () => {
    it(`Should produce a simple report`, async () => {
      // arrange
      const { id: patientId } = await fake(models.Patient);
      const { id: encounterId } = await fake(models.Encounter, { patientId });
      await fake(models.EncounterDiagnosis, { encounterId });
      await fake(models.EncounterMedication, { encounterId });
      await fake(models.Procedure, { encounterId });

      // act
      const response = await app
        .post(`/v1/integration/fijiAspenMediciReport`)
        .send({
          'period.start': subDays(new Date(), 30).toISOString(),
          'period.end': new Date().toISOString(),
        })
        .set({ 'X-Tamanu-Client': 'medici', 'X-Version': '0.0.1' });

      // assert
      expect(response).toHaveSucceeded();
      expect(response.body).toMatchObject([
        {
          patientId: 'BTIO864386',
          firstname: 'Noah',
          lastname: 'Oriti',
          dateOfBirth: '2006-03-15',
          age: 16,
          sex: 'male',
          patientBillingType: null,
          encounterId: '74713f46-74b1-4eeb-9438-174ba3eff290',
          encounterStartDate: '2022-06-10 04:54',
          encounterEndDate: '2022-06-10 04:54',
          encounterType: 'Survey response',
          triageCategory: null,
          waitTime: null,
          department: [
            {
              department: 'Clinic',
              assigned_time: '2022-06-10T04:54:49.703+00:00',
            },
          ],
          location: [
            {
              location: 'Clinic',
              assigned_time: '2022-06-10T04:54:49.703+00:00',
            },
          ],
          reasonForEncounter: 'Survey response for Generic Referral',
          diagnosis: [
            {
              name: 'Acute subdural hematoma',
              code: 'S06.5',
              is_primary: 'primary',
              certainty: 'confirmed',
            },
          ],
          medications: [
            {
              name: 'Glucose (hypertonic) 10%',
              discontinued: true,
              discontinuing_reason: 'No longer clinically indicated',
            },
          ],
          vaccinations: null,
          procedures: [
            {
              name:
                'Subtemporal cranial decompression (pseudotumor cerebri, slit ventricle syndrome)',
              code: '61340',
              date: '2022-10-06',
              location: 'Ba Mission Sub-divisional Hospital General Clinic',
              notes: null,
              completed_notes: null,
            },
          ],
          labRequests: [
            {
              tests: [
                {
                  name: 'Bicarbonate',
                  notes: 'TODO',
                },
              ],
              notes: [
                {
                  note_type: 'other',
                  content: 'Add lab request note',
                  note_date: '2022-06-09T02:04:54.225+00:00',
                },
                {
                  note_type: 'other',
                  content: 'add lab request note 2',
                  note_date: '2022-06-09T02:11:12.789+00:00',
                },
              ],
            },
          ],
          imagingRequests: [
            {
              name: 'CT Scan',
              area_to_be_imaged: null,
              notes: [
                {
                  note_type: 'other',
                  content: 'image request note',
                  note_date: '2022-06-09T02:02:31.648+00:00',
                },
                {
                  note_type: 'areaToBeImaged',
                  content: 'pelvis',
                  note_date: '2022-06-09T02:02:31.712+00:00',
                },
              ],
            },
          ],
          notes: [
            {
              note_type: 'nursing',
              content: 'A\nB\nC\nD\nE\nF\nG\n',
              note_date: '2022-06-10T03:39:57.617+00:00',
            },
          ],
        },
      ]);
    });
  });

  describe('failure', () => {
    it('throws a 422 if a required field is missing', async () => {
      // arrange
      const { fetchId } = await prepareVRSMocks(ctx, {
        vrsPatient: {
          ...(await fakeVRSPatient(ctx.store.models)),
          individual_refno: null, // missing required field
        },
      });

      // act
      const response = await app
        .post(`/v1/integration/fijiVrs/hooks/patientCreated`)
        .send({
          fetch_id: fetchId,
          operation: 'INSERT',
          created_datetime: new Date().toISOString(),
        })
        .set({ 'X-Tamanu-Client': 'fiji-vrs', 'X-Version': '0.0.1' });

      // assert
      expect(response).toHaveRequestError(422);
      expect(response.body).toMatchObject({
        response: false,
        error: {
          message: expect.stringContaining('must be a `string` type'),
          name: 'ValidationError',
        },
      });
      const fetchMock = ctx.integrations.fijiVrs.remote.fetchImplementation;
      expect(fetchMock).toHaveBeenCalledWith(`${host}/token`, expect.anything());
      expect(fetchMock).toHaveBeenCalledWith(
        `${host}/api/Tamanu/Fetch?fetch_id=${fetchId}`,
        expect.anything(),
      );
      expect(fetchMock).not.toHaveBeenCalledWith(
        `${host}/api/Tamanu/Acknowledge?fetch_id=${fetchId}`,
        expect.anything(),
      );
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('throws a 422 if a field is of the wrong type', async () => {
      // arrange
      const { fetchId } = await prepareVRSMocks(ctx, {
        vrsPatient: {
          ...(await fakeVRSPatient(ctx.store.models)),
          dob: 'this is not a valid ISO date',
        },
      });

      // act
      const response = await app
        .post(`/v1/integration/fijiVrs/hooks/patientCreated`)
        .send({
          fetch_id: fetchId,
          operation: 'INSERT',
          created_datetime: new Date().toISOString(),
        })
        .set({ 'X-Tamanu-Client': 'fiji-vrs', 'X-Version': '0.0.1' });

      // assert
      expect(response).toHaveRequestError(422);
      expect(response.body).toMatchObject({
        response: false,
        error: {
          message: expect.stringContaining('must be a `date` type'),
          name: 'ValidationError',
        },
      });
      const fetchMock = ctx.integrations.fijiVrs.remote.fetchImplementation;
      expect(fetchMock).toHaveBeenCalledWith(`${host}/token`, expect.anything());
      expect(fetchMock).toHaveBeenCalledWith(
        `${host}/api/Tamanu/Fetch?fetch_id=${fetchId}`,
        expect.anything(),
      );
      expect(fetchMock).not.toHaveBeenCalledWith(
        `${host}/api/Tamanu/Acknowledge?fetch_id=${fetchId}`,
        expect.anything(),
      );
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('throws a 502 if the remote call fails', async () => {
      // arrange
      const { fetchId } = await prepareVRSMocks(ctx, {
        tokenImpl: () => ({
          ok: false,
          status: 500,
          json: async () => ({
            message: 'test error',
          }),
        }),
      });

      // act
      const response = await app
        .post(`/v1/integration/fijiVrs/hooks/patientCreated`)
        .send({
          fetch_id: fetchId,
          operation: 'INSERT',
          created_datetime: new Date().toISOString(),
        })
        .set({ 'X-Tamanu-Client': 'fiji-vrs', 'X-Version': '0.0.1' });

      // assert
      expect(response).toHaveRequestError(502);
      expect(response.body).toEqual({
        response: false,
        error: {
          message: expect.stringContaining('500'),
          name: 'RemoteCallFailedError',
        },
      });
      const fetchMock = ctx.integrations.fijiVrs.remote.fetchImplementation;
      expect(fetchMock).toHaveBeenCalledWith(`${host}/token`, expect.anything());
      expect(fetchMock).not.toHaveBeenCalledWith(
        `${host}/api/Tamanu/Fetch?fetch_id=${fetchId}`,
        expect.anything(),
      );
      expect(fetchMock).not.toHaveBeenCalledWith(
        `${host}/api/Tamanu/Acknowledge?fetch_id=${fetchId}`,
        expect.anything(),
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it.todo('rejects invalid credentials');
    it.todo('sets response to false on error');
  });
});
