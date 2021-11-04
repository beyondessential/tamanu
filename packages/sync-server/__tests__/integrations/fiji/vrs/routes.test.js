import Chance from 'chance';
import { parseISO } from 'date-fns';

import { REFERENCE_TYPES } from 'shared/constants';
import { createTestContext } from 'sync-server/__tests__/utilities';

const chance = new Chance();

const fakeVillage = () => {
  const name = chance.city();
  const code = name.replace(/[^a-zA-Z]/gi, '');
  return {
    type: REFERENCE_TYPES.VILLAGE,
    name,
    code,
  };
};

const fakeVRSPatient = async ({ ReferenceData }) => {
  const village = await ReferenceData.create(fakeVillage());
  return {
    id_type: 'TAMANU_TESTBED_ID',
    identifier: chance.guid(),

    individual_refno: chance.integer({ min: 0, max: 10000000 }).toString(),
    fname: chance.first(),
    lname: chance.last(),
    dob: chance
      .date({ year: 1980 })
      .toISOString()
      .slice(0, 10),
    sex: chance.pickone(['MALE', 'FEMALE']),
    sub_division: village.name,
    phone: chance.phone(),
    email: chance.email(),
  };
};

describe('VRS integration', () => {
  let ctx;
  beforeEach(async () => {
    ctx = await createTestContext();
  });
  afterEach(async () => ctx.close());

  const prepareVRSHook = async (opts = {}) => {
    const fetchId = chance.integer({ min: 1, max: 100000000 }).toString();
    const token = chance.hash();

    const {
      vrsPatient = await fakeVRSPatient(ctx.store.models),
      tokenImpl = url => {
        expect(url).toEqual(expect.stringContaining('/token'));
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: token,
            expires_in: chance.integer({ min: 100000, max: 1000000 }),
            token_type: 'bearer',
          }),
        };
      },
      fetchImpl = url => {
        expect(url).toEqual(expect.stringContaining(`/api/Tamanu/Fetch/${fetchId}`));
        return {
          ok: true,
          status: 200,
          json: async () => ({
            response: 'success',
            data: vrsPatient,
          }),
        };
      },
      ackImpl = url => {
        expect(url).toEqual(expect.stringContaining(`/api/Tamanu/Acknowledge?fetch_id=${fetchId}`));
        return {
          ok: true,
          status: 200,
          json: async () => ({ response: true }),
        };
      },
    } = opts;

    const fetch = jest
      // error on unexpected calls
      .fn((...args) => {
        throw new Error('unexpected call to fetch', ...args);
      })

      // expect the remote to request a token
      .mockImplementationOnce(tokenImpl)

      // expect the remote to request a patient
      .mockImplementationOnce(fetchImpl)

      // expect the remote to ack
      .mockImplementationOnce(ackImpl);

    ctx.integrations.fiji.vrsRemote.fetchImplementation = fetch;
    return { fetchId, vrsPatient };
  };

  describe('INSERT', () => {
    it('completes successfully', async () => {
      // arrange
      const { Patient, PatientAdditionalData, PatientVRSData, ReferenceData } = ctx.store.models;
      const { fetchId, vrsPatient } = await prepareVRSHook();

      // act
      const response = await ctx.baseApp
        .post(`/v1/public/integration/fiji/vrs/hooks/patientCreated`)
        .send({
          fetch_id: fetchId,
          operation: 'INSERT',
          created_datetime: new Date().toISOString(),
        });

      // assert
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({
        response: false,
      });
      const foundPatient = await Patient.findOne({
        where: { displayId: vrsPatient.individual_refno },
        raw: true,
      });
      const expectedVillage = await ReferenceData.findOne({
        name: vrsPatient.sub_division,
      });
      expect(foundPatient).toEqual({
        id: expect.any(String),
        displayId: vrsPatient.individual_refno,
        firstName: vrsPatient.fname,
        middleName: null,
        lastName: vrsPatient.lname,
        culturalName: null,
        dateOfBirth: parseISO(vrsPatient.dob),
        sex: vrsPatient.sex.toLowerCase(),
        villageId: expectedVillage.id,
        email: vrsPatient.email,

        // metadata
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        deletedAt: null,
        markedForSync: expect.anything(),
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
      });
    });

    it('throws an error if a required field is missing', async () => {
      // arrange
      const { fetchId } = await prepareVRSHook({
        vrsPatient: {
          ...(await fakeVRSPatient(ctx.store.models)),
          individual_refno: null, // missing required field
        },
      });

      // act
      const response = await ctx.baseApp
        .post(`/v1/public/integration/fiji/vrs/hooks/patientCreated`)
        .send({
          fetch_id: fetchId,
          operation: 'INSERT',
          created_datetime: new Date().toISOString(),
        });

      // assert
      expect(response).toHaveRequestError();
    });

    it('throws an error if a field is of the wrong type', async () => {
      // arrange
      const { fetchId } = await prepareVRSHook({
        vrsPatient: {
          ...(await fakeVRSPatient(ctx.store.models)),
          dob: 'this is not a valid ISO date',
        },
      });

      // act
      const response = await ctx.baseApp
        .post(`/v1/public/integration/fiji/vrs/hooks/patientCreated`)
        .send({
          fetch_id: fetchId,
          operation: 'INSERT',
          created_datetime: new Date().toISOString(),
        });

      // assert
      expect(response).toHaveRequestError();
    });

    it('saves unmatched village names so they can be fixed later', async () => {
      // arrange
      const { models } = ctx.store;
      const { fetchId, vrsPatient } = await prepareVRSHook({
        vrsPatient: {
          ...(await fakeVRSPatient(models)),
          sub_division: 'this string does not match a village name',
        },
      });

      // act
      const response = await ctx.baseApp
        .post(`/v1/public/integration/fiji/vrs/hooks/patientCreated`)
        .send({
          fetch_id: fetchId,
          operation: 'INSERT',
          created_datetime: new Date().toISOString(),
        });

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
      });
    });

    it.todo('rejects invalid credentials');
    it.todo('resurrects deleted records');
  });

  describe('UPDATE', () => {
    it.todo('completes successfully');
  });

  describe('DELETE', () => {
    it.todo('completes successfully');
  });
});
