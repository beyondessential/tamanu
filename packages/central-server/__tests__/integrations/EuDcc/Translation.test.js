import { expect } from 'chai';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { createTestContext } from '@tamanu/central-server/__tests__/utilities';
import { createEuDccVaccinationData } from '../../../dist/integrations/EuDcc';

describe('EU DCC: Vaccination', () => {
  let ctx;
  const data = {};

  beforeAll(async () => {
    ctx = await createTestContext();
    const { ReferenceData, CertifiableVaccine } = ctx.store.models;

    /* eslint-disable require-atomic-updates */
    data.vaxDrug = await ReferenceData.create({
      ...fake(ReferenceData),
      type: 'drug',
      name: 'Comirnaty',
    });

    data.vaxManu = await ReferenceData.create({
      ...fake(ReferenceData),
      type: 'manufacturer',
      name: 'BioNTech Manufacturing GmbH',
      code: 'ORG-100030215',
    });

    data.certVax = await CertifiableVaccine.create({
      ...fake(CertifiableVaccine),
      vaccineId: data.vaxDrug.id,
      manufacturerId: data.vaxManu.id,
      icd11DrugCode: 'XM68M6',
      icd11DiseaseCode: 'RA01.0',
      vaccineCode: 'J07BX03',
      targetCode: '840539006',
      euProductCode: 'EU/1/20/1528',
      maximumDosage: 3,
    });
    /* eslint-enable require-atomic-updates */
  });

  afterAll(async () => {
    await data.certVax.destroy();
    await data.vaxManu.destroy();
    await data.vaxDrug.destroy();

    await ctx.close();
  });

  it('translates a vaccine to EU DCC format', async () => {
    // Arrange
    const {
      AdministeredVaccine,
      Department,
      Encounter,
      Facility,
      Location,
      Patient,
      ScheduledVaccine,
      User,
    } = ctx.store.models;

    const patient = await Patient.create({
      ...fake(Patient),
      firstName: 'Fiamē Naomi',
      lastName: 'Mataʻafa', // spellchecker:disable-line
      dateOfBirth: '1957-04-29',
      sex: 'female',
    });

    const scheduledVax = await ScheduledVaccine.create({
      ...fake(ScheduledVaccine),
      label: 'COVID-19 AZ',
      doseLabel: 'Dose 1',
      vaccineId: data.vaxDrug.id,
    });

    const facility = await Facility.create({
      ...fake(Facility),
      name: 'Utopia HQ',
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

    const vaccineEncounter = await Encounter.create({
      ...fake(Encounter),
      patientId: patient.id,
      locationId: location.id,
      departmentId: department.id,
      examinerId: examiner.id,
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
    expect(msg.dob).to.be.oneOf(['1957-04-28', '1957-04-29', '1957-04-30']); // due to testing timezones :/
    expect(msg).to.deep.equal({
      ver: '1.3.0',
      nam: {
        fn: 'Mataʻafa', // spellchecker:disable-line
        fnt: 'MATAAFA',
        gn: 'Fiamē Naomi',
        gnt: 'FIAME<NAOMI',
      },
      dob: msg.dob, // checked above
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
