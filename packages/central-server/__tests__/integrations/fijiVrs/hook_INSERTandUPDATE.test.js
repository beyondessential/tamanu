import { parseISO } from 'date-fns';
import config from 'config';

import { fake } from '@tamanu/fake-data/fake';
import { toDateString } from '@tamanu/utils/dateTime';
import { createTestContext } from '@tamanu/central-server/__tests__/utilities';
import { fakeVRSPatient, prepareVRSMocks } from './sharedHookHelpers';

const { host } = config.integrations.fijiVrs;

describe('VRS integration hook: INSERT and UPDATE operations', () => {
  let ctx;
  let app;
  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  beforeEach(() => {
    // clear token before each test case
    ctx.integrations.fijiVrs.remote.fetchImplementation = null;
    ctx.integrations.fijiVrs.remote.token = null;
  });

  describe('success', () => {
    const testCases = [
      ['INSERT', 'without a previously deleted patient'],
      [
        'INSERT',
        'with a previously deleted patient',
        async (vrsPatient) => {
          const { Patient } = ctx.store.models;
          await Patient.create({
            ...fake(Patient),
            displayId: vrsPatient.individual_refno,
            deletedAt: new Date(),
          });
        },
      ],
      [
        'UPDATE',
        'with an existing patient',
        async (vrsPatient) => {
          const { Patient } = ctx.store.models;
          await Patient.create({
            ...fake(Patient),
            displayId: vrsPatient.individual_refno,
          });
        },
      ],
    ];

    testCases.forEach(([operation, name, testCaseSetup]) => {
      it(`${operation} ${name}`, async () => {
        // arrange
        const { Patient, PatientAdditionalData, PatientVRSData, ReferenceData } = ctx.store.models;
        const { fetchId, vrsPatient } = await prepareVRSMocks(ctx);
        if (testCaseSetup) {
          await testCaseSetup(vrsPatient);
        }

        // act
        const response = await app
          .post(`/api/integration/fijiVrs/hooks/patientCreated`)
          .send({
            fetch_id: fetchId,
            operation,
            created_datetime: new Date().toISOString(),
          })
          .set({ 'X-Tamanu-Client': 'fiji-vrs', 'X-Version': '0.0.1' });

        // assert
        expect(response).toHaveSucceeded();
        expect(response.body).toEqual({
          response: true,
        });
        const foundPatient = await Patient.findOne({
          where: { displayId: vrsPatient.individual_refno },
          raw: true,
        });
        const expectedVillage = await ReferenceData.findOne({
          where: { name: vrsPatient.sub_division },
        });
        expect(foundPatient).toMatchObject({
          id: expect.any(String),
          displayId: vrsPatient.individual_refno,
          firstName: vrsPatient.fname,
          lastName: vrsPatient.lname,
          dateOfBirth: toDateString(parseISO(vrsPatient.dob)),
          sex: vrsPatient.sex.toLowerCase(),
          villageId: expectedVillage.id,
          email: vrsPatient.email,

          // metadata
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          deletedAt: null,
        });
        const foundAdditionalData = await PatientAdditionalData.findOne({
          where: { patientId: foundPatient.id },
          raw: true,
        });
        expect(foundAdditionalData).toMatchObject({
          primaryContactNumber: vrsPatient.phone,
          deletedAt: null,
        });
        const foundVRSData = await PatientVRSData.findOne({
          where: { patientId: foundPatient.id },
          raw: true,
        });
        expect(foundVRSData).toMatchObject({
          idType: vrsPatient.id_type,
          identifier: vrsPatient.identifier,
          unmatchedVillageName: null,
          deletedAt: null,
          isDeletedByRemote: false,
        });
        const fetchMock = ctx.integrations.fijiVrs.remote.fetchImplementation;
        expect(fetchMock).toHaveBeenCalledWith(`${host}/token`, expect.anything());
        expect(fetchMock).toHaveBeenCalledWith(
          `${host}/api/Tamanu/Fetch?fetch_id=${fetchId}`,
          expect.anything(),
        );
        expect(fetchMock).toHaveBeenCalledWith(
          `${host}/api/Tamanu/Acknowledge?fetch_id=${fetchId}`,
          expect.anything(),
        );
        expect(fetchMock).toHaveBeenCalledTimes(3);
      });
    });

    it('saves unmatched village names so they can be fixed later', async () => {
      // arrange
      const { models } = ctx.store;
      const { fetchId, vrsPatient } = await prepareVRSMocks(ctx, {
        vrsPatient: {
          ...(await fakeVRSPatient(models)),
          sub_division: 'this string does not match a village name',
        },
      });

      // act
      const response = await app
        .post(`/api/integration/fijiVrs/hooks/patientCreated`)
        .send({
          fetch_id: fetchId,
          operation: 'INSERT',
          created_datetime: new Date().toISOString(),
        })
        .set({ 'X-Tamanu-Client': 'fiji-vrs', 'X-Version': '0.0.1' });

      // assert
      expect(response).toHaveSucceeded();
      const foundVRSData = await models.PatientVRSData.findOne({
        include: {
          association: 'patient',
          where: { displayId: vrsPatient.individual_refno },
        },
        raw: true,
      });
      expect(foundVRSData).toMatchObject({
        unmatchedVillageName: vrsPatient.sub_division,
        isDeletedByRemote: false,
      });
    });

    it('allows nullable fields to be null', async () => {
      // arrange
      const { Patient, PatientAdditionalData } = ctx.store.models;
      const vrsPatient = {
        ...(await fakeVRSPatient(ctx.store.models)),
        fname: null,
        lname: null,
        dob: null,
        sub_division: null,
        email: null,
        phone: null,
      };
      const { fetchId } = await prepareVRSMocks(ctx, { vrsPatient });

      // act
      const response = await app
        .post(`/api/integration/fijiVrs/hooks/patientCreated`)
        .send({
          fetch_id: fetchId,
          operation: 'INSERT',
          created_datetime: new Date().toISOString(),
        })
        .set({ 'X-Tamanu-Client': 'fiji-vrs', 'X-Version': '0.0.1' });

      // assert
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({
        response: true,
      });
      const foundPatient = await Patient.findOne({
        where: { displayId: vrsPatient.individual_refno },
        raw: true,
      });
      expect(foundPatient).toMatchObject({
        displayId: vrsPatient.individual_refno,
        firstName: null,
        lastName: null,
        dateOfBirth: null,
        villageId: null,
        email: null,
      });
      const foundAdditionalData = await PatientAdditionalData.findOne({
        where: { patientId: foundPatient.id },
        raw: true,
      });
      expect(foundAdditionalData).toMatchObject({
        primaryContactNumber: vrsPatient.phone,
      });
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
        .post(`/api/integration/fijiVrs/hooks/patientCreated`)
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
        .post(`/api/integration/fijiVrs/hooks/patientCreated`)
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
        .post(`/api/integration/fijiVrs/hooks/patientCreated`)
        .send({
          fetch_id: fetchId,
          operation: 'INSERT',
          created_datetime: new Date().toISOString(),
        })
        .set({ 'X-Tamanu-Client': 'fiji-vrs', 'X-Version': '0.0.1' });

      // assert
      expect(response).toHaveRequestError(502);
      expect(response.body).toMatchObject({
        response: false,
        error: {
          status: 502,
          message: expect.stringContaining('500'),
          name: 'RemoteCallError',
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
