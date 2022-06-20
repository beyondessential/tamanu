import { expect } from 'chai';
import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from 'sync-server/__tests__/utilities';
import {
  createVdsNcTestData,
  createVdsNcVaccinationData,
} from '../../../app/integrations/VdsNc';

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
      }
    });
    
    await ReferenceData.destroy({
      where: {
        id: [data.azVaxDrug.id, data.pfVaxDrug.id],
      },
    });
    
    await ctx.close();
  });

  it('fetches data for a non-vaccinated patient', async () => {
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
    const msg = await createVdsNcVaccinationData(patient.id, {
      models: ctx.store.models,
      countryCode: 'UTO',
    });

    // Assert
    expect(msg).to.deep.equal({
      pid: {
        n: 'Katonivere Wiliam',
        dob: '1964-04-20',
        i: 'A1234567',
        sex: 'M',
      },
      ve: [],
    });
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

    const vaccineEncounter = await Encounter.create({
      ...fake(Encounter),
      patientId: patient.id,
      locationId: location.id,
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
      countryCode: 'UTO',
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

    const location1 = await Location.create({
      ...fake(Location),
      facilityId: (
        await Facility.create({
          ...fake(Facility),
          name: 'Utopia Office',
        })
      ).id,
    });

    const location2 = await Location.create({
      ...fake(Location),
      facilityId: (
        await Facility.create({
          ...fake(Facility),
          name: 'Utopia Bureau',
        })
      ).id,
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
        })
      ).id,
      batch: '003',
      date: new Date(Date.parse('24 December 2021, UTC')),
    });

    // Act
    const msg = await createVdsNcVaccinationData(patient.id, {
      models: ctx.store.models,
      countryCode: 'UTO',
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
      Encounter,
      Facility,
      Location,
      LabTest,
      ReferenceData,
      LabRequest,
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
              locationId: (
                await Location.create({
                  ...fake(Location),
                  facilityId: (
                    await Facility.create({
                      ...fake(Facility),
                      name: 'Utopia GP',
                      streetAddress: 'Utopia pastoral lease No. 637',
                      cityTown: 'Urapuntja',
                      email: 'reception@utopia.org.au',
                      contactNumber: '+61889569875',
                    })
                  ).id,
                })
              ).id,
            })
          ).id,
        })
      ).id,
    });

    // Act
    const msg = await createVdsNcTestData(test.id, {
      models: ctx.store.models,
      countryCode: 'UTO',
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
