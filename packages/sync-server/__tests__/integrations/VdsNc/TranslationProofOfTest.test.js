import { expect } from 'chai';
import { fake, fakeUser } from 'shared/test-helpers/fake';
import { createTestContext } from 'sync-server/__tests__/utilities';
import { createVdsNcTestData } from '../../../app/integrations/VdsNc';

describe('VDS: Proof of Test', () => {
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
  });

  afterAll(() => ctx.close());

  it('fetches data for a lab test result', async () => {
    // Arrange
    const {
      Patient,
      PatientAdditionalData,
      Department,
      Encounter,
      Facility,
      Location,
      LabTest,
      ReferenceData,
      LabRequest,
      User,
    } = ctx.store.models;

    const patient = await Patient.create({
      ...fake(Patient),
      firstName: 'Lowitja',
      lastName: 'O’Donoghue',
      dateOfBirth: new Date(Date.parse('1 August 1932, UTC')),
      sex: 'female',
    });
    await PatientAdditionalData.create({
      ...fake(PatientAdditionalData),
      patientId: patient.id,
      passport: 'A1920831',
    });
    await patient.reload();

    const facility = await await Facility.create({
      ...fake(Facility),
      name: 'Utopia GP',
      streetAddress: 'Utopia pastoral lease No. 637',
      cityTown: 'Urapuntja',
      email: 'reception@utopia.org.au',
      contactNumber: '+61889569875',
    });
    const location = await Location.create({
      ...fake(Location),
      facilityId: facility.id,
    });
    const department = await Department.create({
      ...fake(Department),
      facilityId: facility.id,
    });

    const examiner = await User.create(fakeUser());

    const test = await LabTest.create({
      ...fake(LabTest),
      status: 'published',
      result: 'negative',
      completedDate: new Date(Date.parse('Wednesday, 17 March 2022, 11:14:52 +10:30')),
      labTestMethodId: (
        await ReferenceData.create({
          ...fake(ReferenceData),
          type: 'labTestMethod',
          code: 'GeneXpert',
        })
      ).id,
      labRequestId: (
        await LabRequest.create({
          ...fake(LabRequest),
          sampleTime: new Date(Date.parse('Wednesday, 15 March 2022, 14:49:28 +10:30')),
          encounterId: (
            await Encounter.create({
              ...fake(Encounter),
              patientId: patient.id,
              locationId: location.id,
              departmentId: department.id,
              examinerId: examiner.id,
            })
          ).id,
        })
      ).id,
    });

    // Act
    const msg = await createVdsNcTestData(test.id, {
      models: ctx.store.models,
      settings: ctx.settings,
    });

    // Assert
    expect(msg).to.deep.equal({
      pid: {
        n: "O'Donoghue Lowitja",
        dob: '1932-08-01',
        sex: 'F',
        dt: 'P',
        dn: 'A1920831',
      },
      dat: {
        ri: '2022-03-17T00:44:52+00:00',
        sc: '2022-03-15T04:19:28+00:00',
      },
      sp: {
        cd: {
          a: 'Utopia pastoral lease No. 637, Urapuntja',
          e: 'reception@utopia.org.au',
          p: '+61889569875',
        },
        ctr: 'UTO',
        spn: 'Utopia GP',
      },
      tr: {
        r: 'negative',
        tc: 'antigen',
      },
    });
  });
});
