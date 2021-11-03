import Chance from 'chance';
import Sequelize from 'sequelize';
import { createTestContext } from 'sync-server/__tests__/utilities';

const chance = new Chance();

const fakeVRSPatient = async ({ ReferenceData }) => ({
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
  sub_division: await ReferenceData.findOne({
    order: Sequelize.literal('random()'),
  }),
  phone: chance.phone(),
  email: chance.email(),
});

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
      });
      expect(foundPatient).toEqual({
        displayId: vrsPatient.identifier,
        firstName: vrsPatient.fname,
        lastName: vrsPatient.lname,
        dateOfBirth: new Date(vrsPatient.dob),
        sex: vrsPatient.sex.toLowerCase(),
        villageId: await ReferenceData.findOne({ name: vrsPatient.sub_division }),
        deletedAt: null,
      });
      const foundAdditionalData = await PatientAdditionalData.findOne({
        where: { patientId: foundPatient.id },
      });
      expect(foundAdditionalData).toEqual({
        phone: vrsPatient.phone,
        email: vrsPatient.email,
      });
    });

    it.todo('rejects invalid credentials');
    it.todo("throws an error if the schema doesn't match");
  });
});
