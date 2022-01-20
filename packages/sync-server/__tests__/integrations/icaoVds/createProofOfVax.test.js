import { format } from 'date-fns';

import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from 'sync-server/__tests__/utilities';
import { IDENTIFIER_NAMESPACE } from '../../../app/integrations/fiji-vps/schema';
import { createProofOfVax } from '../../../app/integrations/icao-vds/VDSTranslation';

describe('ICAO VDS - createProofOfVax', () => {
  let ctx;
  let app;

  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
  });

  afterAll(() => ctx.close());

  describe('success', () => {
    it('fetches data for a non-vaccinated patient', async () => {
      // arrange
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

      // act
      const { data } = await createProofOfVax(patient.id);

      // assert
      expect(data).toEqual({
        hdr: {
          t: 'icao.vacc',
          v: 1,
          is: 'FJI',
        },
        msg: {
          utci: 'TODO: ANY',
          pid: {
            // This field can only be 39 characters long, just truncate the name
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
        },
      });

      it('fetches data for a vaccinated patient', async () => {
        // arrange
        const { 
          Patient, 
          PatientAdditionalData,
          Encounter,
          ReferenceData,
          ScheduledVaccine,
          AdministeredVaccine
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
        })
        
        const scheduledAz = await ScheduledVaccine.create({
          ...fake(ScheduledVaccine),
          label: 'COVID AZ',
          schedule: 'Dose 1',
          vaccineId: azVaxDrug.id,
        })

        const vaccineEncounter = await Encounter.create({
          ...fake(Encounter),
          patientId: patient.id,
        })

        const administeredAz = await AdministeredVaccine.create({
          ...fake(AdministeredVaccine),
          status: 'GIVEN',
          scheduledVaccineId: scheduledAz.id,
          encounterId: vaccineEncounter.id
        })
  
        // act
        const { data } = await createProofOfVax(patient.id);
  
        // assert
        expect(data).toEqual({
          hdr: {
            t: 'icao.vacc',
            v: 1,
            is: 'FJI',
          },
          msg: {
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
                  }
                ],
              },
            ],
          },
        });
    });

    it("returns no error but no results when subject:identifier doesn't match a patient", async () => {
      // arrange
      const id = encodeURIComponent(`${IDENTIFIER_NAMESPACE}|abc123-not-real`);
      const path = `/v1/integration/fijiVps/Patient?_sort=-issued&_page=0&_count=2&status=final&subject%3Aidentifier=${id}`;

      // act
      const response = await app.get(path);

      // assert
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({
        resourceType: 'Bundle',
        id: 'patients',
        meta: {
          lastUpdated: null,
        },
        type: 'searchset',
        total: 0,
        link: [
          {
            relation: 'self',
            url: expect.stringContaining(path),
          },
        ],
        entry: [],
      });
    });
  });

  describe('failure', () => {
    it('returns a 422 error when passed the wrong query params', async () => {
      // arrange
      const { Patient, PatientAdditionalData } = ctx.store.models;
      const patient = await Patient.create(fake(Patient));
      await PatientAdditionalData.create({
        ...fake(PatientAdditionalData),
        patientId: patient.id,
      });
      const id = encodeURIComponent(`not-the-right-identifier|${patient.displayId}`);
      const path = `/v1/integration/fijiVps/Patient?_sort=id&_page=z&_count=x&status=initial&subject%3Aidentifier=${id}`;

      // act
      const response = await app.get(path);

      // assert
      expect(response).toHaveRequestError(422);
      expect(response.body).toMatchObject({
        error: {
          errors: [
            'subject:identifier must be in the format "<namespace>|<id>"',
            '_count must be a `number` type, but the final value was: `NaN` (cast from the value `"x"`).',
            '_page must be a `number` type, but the final value was: `NaN` (cast from the value `"z"`).',
            '_sort must be one of the following values: -issued',
          ],
        },
      });
    });

    it('returns a 422 error when passed no query params', async () => {
      // arrange
      const { Patient, PatientAdditionalData } = ctx.store.models;
      const patient = await Patient.create(fake(Patient));
      await PatientAdditionalData.create({
        ...fake(PatientAdditionalData),
        patientId: patient.id,
      });
      const path = `/v1/integration/fijiVps/Patient`;

      // act
      const response = await app.get(path);

      // assert
      expect(response).toHaveRequestError(422);
      expect(response.body).toMatchObject({
        error: {
          errors: [
            'subject:identifier must be in the format "<namespace>|<id>"',
            'subject:identifier is a required field',
            '_page is a required field',
            '_sort is a required field',
          ],
        },
      });
    });
  });
});
