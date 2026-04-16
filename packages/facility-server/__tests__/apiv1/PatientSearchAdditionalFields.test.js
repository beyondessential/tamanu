import config from 'config';
import { createDummyPatient } from '@tamanu/database/demoData/patients';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { createTestContext } from '../utilities';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { afterAll, beforeAll, describe, it, expect } from '@jest/globals';

describe('Patient search - additional search fields', () => {
  let app;
  let models;
  let ctx;

  const [facilityId] = selectFacilityIds(config);

  const createPatientWithAdditionalData = async (patientOverrides, padOverrides) => {
    const patientData = await createDummyPatient(models, patientOverrides);
    const patient = await models.Patient.create(patientData);
    if (padOverrides) {
      await models.PatientAdditionalData.create({
        patientId: patient.id,
        ...padOverrides,
      });
    }
    return patient;
  };

  const configureAdditionalSearchFields = async fields => {
    await models.Setting.set(
      'patientSearch.additionalSearchFields',
      fields,
      SETTINGS_SCOPES.GLOBAL,
    );
  };

  const searchPatients = query =>
    app
      .get(`/api/patient?facilityId=${facilityId}&isAllPatientsListing=true&matchSecondaryIds=true`)
      .query(query);

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    app = await ctx.baseApp.asRole('practitioner');
  });

  afterAll(() => ctx.close());

  describe('searching by PAD text fields', () => {
    let patientWithPassport;

    beforeAll(async () => {
      await configureAdditionalSearchFields(['passport']);

      patientWithPassport = await createPatientWithAdditionalData(
        { firstName: 'pad-passport-test' },
        { passport: 'XY123456' },
      );
      await createPatientWithAdditionalData(
        { firstName: 'pad-passport-other' },
        { passport: 'ZZ999999' },
      );
      await createPatientWithAdditionalData({ firstName: 'pad-no-passport' }, {});
    });

    it('should find a patient by a PAD text field (passport)', async () => {
      const response = await searchPatients({ passport: 'XY123456' });
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);
      expect(response.body.data[0].id).toEqual(patientWithPassport.id);
    });

    it('should find a patient by partial match (case insensitive)', async () => {
      const response = await searchPatients({ passport: 'xy123' });
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);
      expect(response.body.data[0].id).toEqual(patientWithPassport.id);
    });

    it('should return no results for non-matching PAD field value', async () => {
      const response = await searchPatients({ passport: 'NONEXISTENT' });
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(0);
    });
  });

  describe('searching by patient model fields', () => {
    let patientWithEmail;

    beforeAll(async () => {
      await configureAdditionalSearchFields(['email']);

      patientWithEmail = await createPatientWithAdditionalData({
        firstName: 'email-search-test',
        email: 'unique-test-email@example.com',
      });
    });

    it('should find a patient by an additional patient model field (email)', async () => {
      const response = await searchPatients({ email: 'unique-test-email' });
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);
      expect(response.body.data[0].id).toEqual(patientWithEmail.id);
    });
  });

  describe('searching by reference data fields', () => {
    let patientWithNationality;
    let nationalityRef;

    beforeAll(async () => {
      await configureAdditionalSearchFields(['nationalityId']);

      nationalityRef = await models.ReferenceData.create({
        type: 'nationality',
        name: 'TestNationalityForSearch',
        code: 'test-nationality-search',
      });

      patientWithNationality = await createPatientWithAdditionalData(
        { firstName: 'nationality-search-test' },
        { nationalityId: nationalityRef.id },
      );
      await createPatientWithAdditionalData(
        { firstName: 'nationality-search-other' },
        {},
      );
    });

    it('should find a patient by reference data field (nationalityId)', async () => {
      const response = await searchPatients({ nationalityId: nationalityRef.id });
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);
      expect(response.body.data[0].id).toEqual(patientWithNationality.id);
    });

    it('should not find patients when ID does not match', async () => {
      const response = await searchPatients({ nationalityId: 'nonexistent-id' });
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(0);
    });
  });

  describe('ignoring unconfigured fields', () => {
    beforeAll(async () => {
      await configureAdditionalSearchFields([]);
    });

    it('should ignore additional field params when not configured', async () => {
      await createPatientWithAdditionalData(
        { firstName: 'unconfigured-field-test' },
        { passport: 'SHOULD-NOT-FILTER' },
      );

      const response = await searchPatients({
        firstName: 'unconfigured-field-test',
        passport: 'SHOULD-NOT-FILTER',
      });
      expect(response).toHaveSucceeded();
      expect(response.body.count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('ignoring already-searchable fields in config', () => {
    beforeAll(async () => {
      await configureAdditionalSearchFields(['firstName', 'passport']);
    });

    it('should not double-filter already-searchable fields (firstName is already handled)', async () => {
      const response = await searchPatients({ firstName: 'pad-passport-test' });
      expect(response).toHaveSucceeded();
      expect(response.body.count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('combining additional fields with existing search fields', () => {
    let targetPatient;

    beforeAll(async () => {
      await configureAdditionalSearchFields(['passport']);

      targetPatient = await createPatientWithAdditionalData(
        { firstName: 'combined-search-test', lastName: 'CombinedLastName' },
        { passport: 'COMBINED789' },
      );
      await createPatientWithAdditionalData(
        { firstName: 'combined-search-test', lastName: 'DifferentLast' },
        { passport: 'DIFFERENT456' },
      );
    });

    it('should combine additional fields with standard search fields', async () => {
      const response = await searchPatients({
        firstName: 'combined-search-test',
        passport: 'COMBINED789',
      });
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);
      expect(response.body.data[0].id).toEqual(targetPatient.id);
    });
  });
});
