import { expect } from 'chai';
import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from 'sync-server/__tests__/utilities';
import { createPoT, createPoV } from '../../../app/integrations/VdsNc';

describe('VDS: Proof of Vaccination', () => {
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
  });

  afterAll(() => ctx.close());

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
    const msg = await createPoV(patient.id, { models: ctx.store.models, countryCode: 'UTO' });

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
    await PatientAdditionalData.create({
      ...fake(PatientAdditionalData),
      patientId: patient.id,
      passport: 'A2345678',
    });
    await patient.reload();

    const azVaxDrug = await ReferenceData.create({
      ...fake(ReferenceData),
      type: 'vaccine',
      name: 'ChAdOx1-S',
    });

    const scheduledAz = await ScheduledVaccine.create({
      ...fake(ScheduledVaccine),
      label: 'COVID-19 AZ',
      schedule: 'Dose 1',
      vaccineId: azVaxDrug.id,
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
    const msg = await createPoV(patient.id, { models: ctx.store.models, countryCode: 'UTO' });

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
          vd: {
            adm: 'Utopia HQ',
            ctr: 'UTO',
            dvc: '2022-02-22',
            lot: '1234-567-890',
            seq: 1,
          },
        },
      ],
    });
  });
});
