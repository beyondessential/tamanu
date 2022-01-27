import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from 'sync-server/__tests__/utilities';
import { createPoV } from '../../../app/integrations/VdsNc';

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
      dateOfBirth: new Date(2000, 6, 3),
      sex: 'male', // is setting these fields like this prefered, or is it better to translate whatever comes out?
    });
    const additionalData = await PatientAdditionalData.create({
      ...fake(PatientAdditionalData),
      patientId: patient.id,
    });
    await patient.reload(); // saving PatientAdditionalData updates the patient too

    // Act
    const msg = await createPoV(patient.id);

    // Assert
    expect(msg).toDeepEqual({
        utci: 'TODO: ANY',
        pid: {
          // This field can only be 39 characters long, just truncate the name?
          // Refer to 9303? Can we maybe truncate the first name preferentially
          n: `${patient.firstName} ${patient.lastName}`.slice(0, 39),
          dob: '2000-6-3',
          dt: 'P',
          dn: additionalData.passport,
          sex: 'M',
        },
        ve: [
          // Double check this is what we want.
          {
            des: 'XM68M6',
            name: '', // <- check
            dis: 'RA01.0',
            vd: [],
          },
        ],
    });
  });

    it('fetches data for a vaccinated patient', async () => {
      // Arrange
      const {
        Patient,
        PatientAdditionalData,
        Encounter,
        ReferenceData,
        ScheduledVaccine,
        AdministeredVaccine,
      } = ctx.store.models;

      const patient = await Patient.create({
        ...fake(Patient),
        dateOfBirth: new Date(2000, 6, 3),
        sex: 'male', // is setting these fields like this prefered, or is it better to translate whatever comes out?
      });
      const additionalData = await PatientAdditionalData.create({
        ...fake(PatientAdditionalData),
        patientId: patient.id,
      });
      await patient.reload(); // saving PatientAdditionalData updates the patient too

      const azVaxDrug = await ReferenceData.create({
        ...fake(ReferenceData),
        name: 'COVID Vaccine category',
      });

      const scheduledAz = await ScheduledVaccine.create({
        ...fake(ScheduledVaccine),
        label: 'COVID AZ',
        schedule: 'Dose 1',
        vaccineId: azVaxDrug.id,
      });

      const vaccineEncounter = await Encounter.create({
        ...fake(Encounter),
        patientId: patient.id,
      });

      const administeredAz = await AdministeredVaccine.create({
        ...fake(AdministeredVaccine),
        status: 'GIVEN',
        scheduledVaccineId: scheduledAz.id,
        encounterId: vaccineEncounter.id,
      });

      // Act
      const msg = await createPoV(patient.id);

      // Assert
      expect(msg).toDeepEqual({
          utci: 'TODO: ANY',
          pid: {
            // This field can only be 39 characters long, just truncate the name
            n: `${patient.firstName} ${patient.lastName}`.slice(0, 39),
            dob: '2000-06-03',
            i: additionalData.passport,
            sex: 'M',
          },
          ve: [
            // Double check this is what we want.
            {
              des: 'XM68M6',
              name: '', // <- check
              dis: 'RA01.0',
              vd: [
                {
                  seq: 1,
                  ctr: 'FJI',
                  lot: administeredAz.batch,
                  dvn: null, // not sure how to handle this?
                },
              ],
            },
          ],
      });
    });
  });
