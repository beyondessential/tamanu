import { expect } from 'chai';
import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from 'sync-server/__tests__/utilities';
import { createEuDccVaccinationData } from '../../../app/integrations/EuDcc';

describe('EU DCC: Vaccination', () => {
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
  });

  afterAll(() => ctx.close());

  it('translates a vaccine to EU DCC format', async () => {
    // Arrange
    const {
      Patient,
      Encounter,
      Facility,
      Location,
      ReferenceData,
      ScheduledVaccine,
      AdministeredVaccine,
    } = ctx.store.models;

    const patient = await Patient.create({
      ...fake(Patient),
      firstName: 'Fiamē Naomi',
      lastName: 'Mataʻafa',
      dateOfBirth: new Date(Date.parse('29 April 1957, UTC')),
      sex: 'female',
    });

    const vaxDrug = await ReferenceData.create({
      ...fake(ReferenceData),
      id: 'drug-COVID-19-Pfizer',
      type: 'drug',
      name: 'COVID-19 Pfizer',
    });

    const scheduledVax = await ScheduledVaccine.create({
      ...fake(ScheduledVaccine),
      label: 'COVID-19 AZ',
      schedule: 'Dose 1',
      vaccineId: vaxDrug.id,
    });

    const facility = await Facility.create({
      ...fake(Facility),
      name: 'Utopia HQ',
    });

    const location = await Location.create({
      ...fake(Location),
      facilityId: facility.id,
    });

    const vaccineEncounter = await Encounter.create({
      ...fake(Encounter),
      patientId: patient.id,
      locationId: location.id,
    });

    const vax = await AdministeredVaccine.create({
      ...fake(AdministeredVaccine),
      id: '2038d060-25a7-4db1-aa33-5c7e0307b0d4',
      status: 'GIVEN',
      scheduledVaccineId: scheduledVax.id,
      encounterId: vaccineEncounter.id,
      batch: '1234-567-890',
      date: new Date(Date.parse('22 February 2022, UTC')),
    });

    // Act
    const msg = await createEuDccVaccinationData(vax.id, {
      models: ctx.store.models,
    });

    // Assert
    expect(msg).to.deep.equal({
      ver: '1.3.0',
      nam: {
        fn: 'Mataʻafa',
        fnt: 'MATAAFA',
        gn: 'Fiamē Naomi',
        gnt: 'FIAME<NAOMI',
      },
      dob: '1957-04-29',
      v: [
        {
          ci: 'URN:UVCI:01:UT:2038D06025A74DB1AA335C7E0307B0D4#E',
          co: 'UT',
          dn: 1,
          dt: '2022-02-22',
          is: 'Utopia HQ',
          ma: 'ORG-100030215',
          mp: 'EU/1/20/1528',
          sd: 3,
          tg: '840539006',
          vp: 'J07BX03',
        },
      ],
    });
  });
});
