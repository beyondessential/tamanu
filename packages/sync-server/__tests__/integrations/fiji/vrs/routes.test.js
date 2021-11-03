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
    individual_refno: chance.integer({ min: 0, max: 10000000 }),
    id_type: 'TAMANU_TESTBED_ID',

    identifier: chance.guid(),
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
  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(async () => ctx.close());

  describe('INSERT', () => {
    it('completes successfully', async () => {
      // arrange
      const { store, baseApp } = ctx;
      const { models } = store;
      const { Patient, PatientAdditionalData, ReferenceData } = models;

      const vrsPatient = await fakeVRSPatient(models);
      const fetchId = chance.integer({ min: 1, max: 100000000 }).toString();
      const token = chance.hash();

      ctx.integrations.fiji.vrsRemote.fetchImplementation = jest
        // error on unexpected calls
        .fn((...args) => {
          throw new Error('unexpected call to fetch', ...args);
        })

        // expect the remote to request a token
        .mockImplementationOnce(url => {
          expect(url).toEqual(expect.stringContaining('/token'));
          console.log(url);
          return {
            ok: true,
            status: 200,
            json: async () => ({
              access_token: token,
              expires_in: chance.integer({ min: 100000, max: 1000000 }),
              token_type: 'bearer',
            }),
          };
        })

        // expect the remote to request a patient
        .mockImplementationOnce(url => {
          expect(url).toEqual(expect.stringContaining(`/api/Tamanu/Fetch/${fetchId}`));
          console.log(url);
          return {
            ok: true,
            status: 200,
            json: async () => ({
              response: 'success',
              data: vrsPatient,
            }),
          };
        })

        // expect the remote to ack
        .mockImplementationOnce(url => {
          expect(url).toEqual(
            expect.stringContaining(`/api/Tamanu/Acknowledge?fetch_id=${fetchId}`),
          );
          console.log(url);
          return {
            ok: true,
            status: 200,
            json: async () => ({ response: true }),
          };
        });

      // act
      const response = await baseApp
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
        where: { displayId: vrsPatient.identifier },
        raw: true,
      });
      const expectedVillage = await ReferenceData.findOne({
        name: vrsPatient.sub_division,
      });
      expect(foundPatient).toEqual({
        id: expect.any(String),
        displayId: vrsPatient.identifier,
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
      });
    });

    it.todo('rejects invalid credentials');
    it.todo("throws an error if the schema doesn't match");
  });
});
