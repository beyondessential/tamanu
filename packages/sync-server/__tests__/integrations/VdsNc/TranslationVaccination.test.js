import { expect } from 'chai';
import { fake, fakeUser } from '@tamanu/shared/test-helpers/fake';
import { createTestContext } from 'sync-server/__tests__/utilities';
import { createVdsNcVaccinationData } from '../../../app/integrations/VdsNc';

describe('VDS: Proof of Vaccination', () => {
  let ctx;
  const data = {};

  beforeAll(async () => {
    ctx = await createTestContext();
    const { ReferenceData, CertifiableVaccine } = ctx.store.models;

    data.azVaxDrug = await ReferenceData.create({
      ...fake(ReferenceData),
      type: 'vaccine',
      name: 'ChAdOx1-S',
    });

    data.pfVaxDrug = await ReferenceData.create({
      ...fake(ReferenceData),
      type: 'vaccine',
      name: 'Comirnaty',
    });

    data.azCertVax = await CertifiableVaccine.create({
      ...fake(CertifiableVaccine),
      vaccineId: data.azVaxDrug.id,
      icd11DrugCode: 'XM68M6',
      icd11DiseaseCode: 'RA01.0',
      maximumDosage: 3,
    });

    data.pfCertVax = await CertifiableVaccine.create({
      ...fake(CertifiableVaccine),
      vaccineId: data.pfVaxDrug.id,
      icd11DrugCode: 'XM68M6',
      icd11DiseaseCode: 'RA01.0',
      maximumDosage: 3,
    });
  });

  afterAll(async () => {
    const { ReferenceData, CertifiableVaccine } = ctx.store.models;

    await CertifiableVaccine.destroy({
      where: {
        id: [data.azCertVax.id, data.pfCertVax.id],
      },
    });

    await ReferenceData.destroy({
      where: {
        id: [data.azVaxDrug.id, data.pfVaxDrug.id],
      },
    });

    await ctx.close();
  });

  it('errors for a non-vaccinated patient', async () => {
    // Arrange
    const { Patient, PatientAdditionalData } = ctx.store.models;
    const patient = await Patient.create({
      ...fake(Patient),
      firstName: 'Wiliam',
      lastName: 'Katonivere',
      dateOfBirth: new Date(Date.parse('20 April 1964, UTC')),
      sex: 'male',
    });
    await PatientAdditionalData.create({
      ...fake(PatientAdditionalData),
      patientId: patient.id,
      passport: 'A1234567',
    });
    await patient.reload();

    // Act
    const result = await createVdsNcVaccinationData(patient.id, {
      models: ctx.store.models,
      settings: ctx.settings,
    }).then(
      resolved => ({ resolved }),
      rejected => ({ rejected }),
    );

    // Assert
    expect(result.resolved).to.be.undefined;
    expect(result.rejected).to.exist.and.be.an.instanceOf(Error);
  });

  it('fetches data for a vaccinated patient', async () => {
    // Arrange
    const {
      Patient,
      PatientAdditionalData,
      Encounter,
      Facility,
      Location,
      ScheduledVaccine,
      AdministeredVaccine,
      Department,
      User,
    } = ctx.store.models;

    const patient = await Patient.create({
      ...fake(Patient),
      firstName: 'Fiamē Naomi',
      lastName: 'Mataʻafa',
      dateOfBirth: new Date(Date.parse('29 April 1957, UTC')),
      sex: 'female',
    });
    await PatientAdditionalData.create({
      ...fake(PatientAdditionalData),
      patientId: patient.id,
      passport: 'A2345678',
    });
    await patient.reload();

    const scheduledAz = await ScheduledVaccine.create({
      ...fake(ScheduledVaccine),
      label: 'COVID-19 AZ',
      schedule: 'Dose 1',
      vaccineId: data.azVaxDrug.id,
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

    await AdministeredVaccine.create({
      ...fake(AdministeredVaccine),
      status: 'GIVEN',
      scheduledVaccineId: scheduledAz.id,
      encounterId: vaccineEncounter.id,
      batch: '1234-567-890',
      date: new Date(Date.parse('22 February 2022, UTC')),
    });

    // Act
    const msg = await createVdsNcVaccinationData(patient.id, {
      models: ctx.store.models,
      settings: ctx.settings,
    });

    // Assert
    expect(msg).to.deep.equal({
      pid: {
        n: 'Mata`afa Fiame Naomi',
        dob: '1957-04-29',
        i: 'A2345678',
        sex: 'F',
      },
      ve: [
        {
          des: 'XM68M6',
          dis: 'RA01.0',
          nam: 'ChAdOx1-S',
          vd: [
            {
              adm: 'Utopia HQ',
              ctr: 'UTO',
              dvc: '2022-02-22',
              lot: '1234-567-890',
              seq: 1,
            },
          ],
        },
      ],
    });
  });

  it('fetches data for a multi-vaccinated patient', async () => {
    // Arrange
    const {
      Patient,
      PatientAdditionalData,
      Encounter,
      Facility,
      Location,
      Department,
      User,
      ScheduledVaccine,
      AdministeredVaccine,
    } = ctx.store.models;

    const patient = await Patient.create({
      ...fake(Patient),
      firstName: 'Surangel',
      lastName: 'Whipps',
      dateOfBirth: new Date(Date.parse('9 August 1968, UTC')),
      sex: 'other',
    });
    await PatientAdditionalData.create({
      ...fake(PatientAdditionalData),
      patientId: patient.id,
      passport: 'A0101001',
    });
    await patient.reload();

    const examiner = await User.create(fakeUser());

    const scheduledPf1 = await ScheduledVaccine.create({
      ...fake(ScheduledVaccine),
      label: 'COVID-19 Pfizer',
      schedule: 'Dose 1',
      vaccineId: data.pfVaxDrug.id,
    });

    const scheduledPf2 = await ScheduledVaccine.create({
      ...fake(ScheduledVaccine),
      label: 'COVID-19 Pfizer',
      schedule: 'Dose 2',
      vaccineId: data.pfVaxDrug.id,
    });

    const scheduledAz3 = await ScheduledVaccine.create({
      ...fake(ScheduledVaccine),
      label: 'COVID-19 AZ',
      schedule: 'Dose 3',
      vaccineId: data.azVaxDrug.id,
    });

    const facility1 = await Facility.create({
      ...fake(Facility),
      name: 'Utopia Office',
    });
    const facility2 = await Facility.create({
      ...fake(Facility),
      name: 'Utopia Bureau',
    });

    const location1 = await Location.create({
      ...fake(Location),
      facilityId: facility1.id,
    });

    const location2 = await Location.create({
      ...fake(Location),
      facilityId: facility2.id,
    });

    const department1 = await Department.create({
      ...fake(Department),
      facilityId: facility1.id,
    });

    const department2 = await Department.create({
      ...fake(Department),
      facilityId: facility2.id,
    });

    await AdministeredVaccine.create({
      ...fake(AdministeredVaccine),
      status: 'GIVEN',
      scheduledVaccineId: scheduledPf1.id,
      encounterId: (
        await Encounter.create({
          ...fake(Encounter),
          patientId: patient.id,
          locationId: location1.id,
          departmentId: department1.id,
          examinerId: examiner.id,
        })
      ).id,
      batch: '001',
      date: new Date(Date.parse('11 January 2021, UTC')),
    });

    await AdministeredVaccine.create({
      ...fake(AdministeredVaccine),
      status: 'GIVEN',
      scheduledVaccineId: scheduledPf2.id,
      encounterId: (
        await Encounter.create({
          ...fake(Encounter),
          patientId: patient.id,
          locationId: location2.id,
          departmentId: department2.id,
          examinerId: examiner.id,
        })
      ).id,
      batch: '002',
      date: new Date(Date.parse('12 June 2021, UTC')),
    });

    await AdministeredVaccine.create({
      ...fake(AdministeredVaccine),
      status: 'GIVEN',
      scheduledVaccineId: scheduledAz3.id,
      encounterId: (
        await Encounter.create({
          ...fake(Encounter),
          patientId: patient.id,
          locationId: location1.id,
          departmentId: department1.id,
          examinerId: examiner.id,
        })
      ).id,
      batch: '003',
      date: new Date(Date.parse('24 December 2021, UTC')),
    });

    // Act
    const msg = await createVdsNcVaccinationData(patient.id, {
      models: ctx.store.models,
      settings: ctx.settings,
    });

    // Assert
    expect(msg).to.deep.equal({
      pid: {
        n: 'Whipps Surangel',
        dob: '1968-08-09',
        i: 'A0101001',
        sex: 'O',
      },
      ve: [
        {
          des: 'XM68M6',
          dis: 'RA01.0',
          nam: 'Comirnaty',
          vd: [
            {
              adm: 'Utopia Office',
              ctr: 'UTO',
              dvc: '2021-01-11',
              lot: '001',
              seq: 1,
            },
            {
              adm: 'Utopia Bureau',
              ctr: 'UTO',
              dvc: '2021-06-12',
              lot: '002',
              seq: 2,
            },
          ],
        },
        {
          des: 'XM68M6',
          dis: 'RA01.0',
          nam: 'ChAdOx1-S',
          vd: [
            {
              adm: 'Utopia Office',
              ctr: 'UTO',
              dvc: '2021-12-24',
              lot: '003',
              seq: 3,
            },
          ],
        },
      ],
    });
  });
});
