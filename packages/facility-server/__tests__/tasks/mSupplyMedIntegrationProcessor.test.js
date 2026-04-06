import config from 'config';
import { createTestContext } from '../utilities';
import { mSupplyMedIntegrationProcessor } from '../../dist/tasks/mSupplyMedIntegrationProcessor';
import { fetchWithRetryBackoff } from '@tamanu/api-client/fetchWithRetryBackoff';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import { createDummyPatient, createDummyEncounter, createDummyPrescription } from '@tamanu/database/demoData/patients';
import { chance, fake, fakeUser } from '@tamanu/fake-data/fake';
import { REFERENCE_TYPES, SETTINGS_SCOPES } from '@tamanu/constants';
import { FACT_MSUPPLY_MED_INTEGRATION_ENABLED_AT } from '@tamanu/constants/facts';
import { settingsCache } from '@tamanu/settings';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

jest.mock('@tamanu/utils/selectFacilityIds', () => ({
  selectFacilityIds: jest.fn(() => ['balwyn']),
}));

jest.mock('@tamanu/api-client/fetchWithRetryBackoff');
jest.mock('@tamanu/utils/sleepAsync', () => ({ sleepAsync: jest.fn(() => Promise.resolve()) }));

const INTEGRATION_SETTINGS = {
  host: 'https://msupply.example.com',
  storeId: 'store-1',
  customerCode: 'CUST01',
};

const INTEGRATION_CONFIG = {
  enabled: true,
  username: 'test-user',
  password: 'test-pass',
};

const SCHEDULE_CONFIG = {
  schedule: '* * * * *',
  jitterTime: '1s',
  enabled: true,
  batchSize: 2,
  batchSleepAsyncDurationInMilliseconds: 10,
};

function mockAuthResponse(token = 'test-token') {
  fetchWithRetryBackoff.mockResolvedValueOnce({
    json: () =>
      Promise.resolve({
        data: { authToken: { token } },
      }),
  });
}

function mockPostResponse(success = true, message = 'ok', items = undefined) {
  const queryResponse = success
    ? { success: true, message, ...(items !== undefined && { items }) }
    : { success: false, message, ...(items !== undefined && { items }) };
  fetchWithRetryBackoff.mockResolvedValueOnce({
    json: () =>
      Promise.resolve({
        data: { pluginGraphqlQuery: queryResponse },
      }),
  });
}

async function createMedicationDispenses(
  models,
  { facilityId, encounterId, orderingClinicianId, dispensedByUserId, medicationId, count = 1 },
) {
  const { PharmacyOrder, Prescription, PharmacyOrderPrescription, MedicationDispense } = models;
  const order = await PharmacyOrder.create({
    facilityId,
    encounterId,
    orderingClinicianId,
    date: getCurrentDateTimeString(),
    isDischargePrescription: false,
  });
  const dispenses = [];
  for (let i = 0; i < count; i++) {
    const prescription = await Prescription.create(
      await createDummyPrescription(models, {
        medicationId,
        units: 'mg',
        frequency: 'daily',
        route: 'oral',
      }),
    );
    const pop = await PharmacyOrderPrescription.create({
      pharmacyOrderId: order.id,
      prescriptionId: prescription.id,
      quantity: 1,
      isCompleted: false,
    });
    const dispense = await MedicationDispense.create({
      pharmacyOrderPrescriptionId: pop.id,
      quantity: 1,
      dispensedByUserId,
    });
    dispenses.push(dispense);
  }
  return dispenses;
}

describe('mSupplyMedIntegrationProcessor', () => {
  const facilityId = 'balwyn';
  let context;
  let models;
  let clinicianId;
  let dispensedByUserId;
  let patientId;
  let encounterId;
  let medicationId;

  beforeAll(async () => {
    config.serverFacilityId = null;
    context = await createTestContext();
    models = context.models;

    config.integrations.mSupplyMed = INTEGRATION_CONFIG;
    config.schedules.mSupplyMedIntegrationProcessor = SCHEDULE_CONFIG;
    selectFacilityIds.mockReturnValue([facilityId]);

    await models.Setting.set(
      'integrations.mSupplyMed',
      INTEGRATION_SETTINGS,
      SETTINGS_SCOPES.FACILITY,
      facilityId,
    );
    settingsCache.reset();

    const clinician = await models.User.create({ ...fakeUser(), role: 'practitioner' });
    clinicianId = clinician.id;
    dispensedByUserId = clinician.id;

    const locationGroup = await models.LocationGroup.create(
      fake(models.LocationGroup, { facilityId }),
    );
    const location = await models.Location.create(
      fake(models.Location, { locationGroupId: locationGroup.id, facilityId }),
    );
    const patient = await models.Patient.create(await createDummyPatient(models));
    patientId = patient.id;
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId,
      locationId: location.id,
      examinerId: clinicianId,
    });
    encounterId = encounter.id;

    const drug = await models.ReferenceData.create({
      ...fake(models.ReferenceData),
      type: REFERENCE_TYPES.DRUG,
      code: 'MED-TEST-001',
      name: 'Test medication',
    });
    medicationId = drug.id;

    await models.LocalSystemFact.set(
      FACT_MSUPPLY_MED_INTEGRATION_ENABLED_AT,
      new Date(Date.now()).toISOString(),
    );
  });

  afterAll(() => context?.close());

  // Reset mocks and config before each test
  beforeEach(() => {
    jest.clearAllMocks();
    selectFacilityIds.mockReturnValue([facilityId]);
    config.integrations.mSupplyMed = INTEGRATION_CONFIG;
    config.schedules.mSupplyMedIntegrationProcessor = SCHEDULE_CONFIG;
  });

  describe('when server is an omni server', () => {
    afterAll(() => {
      selectFacilityIds.mockReturnValue([facilityId]);
    });

    it('skips run when server has multiple facility ids', async () => {
      selectFacilityIds.mockReturnValue(['balwyn', 'kerang']);
      const task = new mSupplyMedIntegrationProcessor(context);
      await task.run();

      expect(fetchWithRetryBackoff).not.toHaveBeenCalled();
    });
  });

  describe('when schedule config is invalid', () => {
    afterAll(() => {
      config.schedules.mSupplyMedIntegrationProcessor = SCHEDULE_CONFIG;
    });

    it('throws when batchSize or batchSleepAsyncDurationInMilliseconds is missing', async () => {
      const missingField = chance.pickone(['batchSize', 'batchSleepAsyncDurationInMilliseconds']);
      config.schedules.mSupplyMedIntegrationProcessor = {
        ...SCHEDULE_CONFIG,
        [missingField]: undefined,
      };
      const task = new mSupplyMedIntegrationProcessor(context);
      await expect(task.run()).rejects.toThrow(
        'batchSize and batchSleepAsyncDurationInMilliseconds must be set for mSupplyMedIntegrationProcessor',
      );
    });
  });

  describe('when integration config is invalid', () => {
    afterAll(async () => {
      config.integrations.mSupplyMed = INTEGRATION_CONFIG;
      await models.LocalSystemFact.set(
        FACT_MSUPPLY_MED_INTEGRATION_ENABLED_AT,
        new Date(Date.now()).toISOString(),
      );
    });

    it('skips run when enabled is false and removes enabled-at fact', async () => {
      config.integrations.mSupplyMed = { ...INTEGRATION_CONFIG, enabled: false };

      const task = new mSupplyMedIntegrationProcessor(context);
      await task.run();

      expect(fetchWithRetryBackoff).not.toHaveBeenCalled();
      const enabledAt = await models.LocalSystemFact.get(FACT_MSUPPLY_MED_INTEGRATION_ENABLED_AT);
      expect(enabledAt).toBeNull();
    });

    it('skips run when username or password is missing', async () => {
      const missingField = chance.pickone(['username', 'password']);
      config.integrations.mSupplyMed = { ...INTEGRATION_CONFIG, [missingField]: '' };

      const task = new mSupplyMedIntegrationProcessor(context);
      await task.run();

      expect(fetchWithRetryBackoff).not.toHaveBeenCalled();
    });
  });

  describe('when integration settings are invalid', () => {
    afterAll(async () => {
      await models.Setting.set(
        'integrations.mSupplyMed',
        INTEGRATION_SETTINGS,
        SETTINGS_SCOPES.FACILITY,
        facilityId,
      );
      settingsCache.reset();
    });

    it('skips run when host, storeId or customerCode is missing', async () => {
      const missingField = chance.pickone(['host', 'storeId', 'customerCode']);
      await models.Setting.set(
        'integrations.mSupplyMed',
        { ...INTEGRATION_SETTINGS, [missingField]: '' },
        SETTINGS_SCOPES.FACILITY,
        facilityId,
      );
      settingsCache.reset();

      const task = new mSupplyMedIntegrationProcessor(context);
      await task.run();

      expect(fetchWithRetryBackoff).not.toHaveBeenCalled();
    });
  });

  describe('enabled-at fact behaviour when integration is enabled', () => {
    it('sets enabled-at fact to current date if it is not set', async () => {
      await models.LocalSystemFact.destroy({
        where: { key: FACT_MSUPPLY_MED_INTEGRATION_ENABLED_AT },
        force: true,
      });
      const task = new mSupplyMedIntegrationProcessor(context);
      await task.run();
      const enabledAt = await models.LocalSystemFact.get(FACT_MSUPPLY_MED_INTEGRATION_ENABLED_AT);
      expect(enabledAt).toBeTruthy();
    });

    it('does not update enabled-at fact if it is already set', async () => {
      const previousEnabledAt = await models.LocalSystemFact.get(FACT_MSUPPLY_MED_INTEGRATION_ENABLED_AT);
      const task = new mSupplyMedIntegrationProcessor(context);
      await task.run();
      const enabledAt = await models.LocalSystemFact.get(FACT_MSUPPLY_MED_INTEGRATION_ENABLED_AT);
      expect(enabledAt).toBe(previousEnabledAt);
    });
  });

  describe('when there is nothing to process', () => {
    it('returns without calling auth or post', async () => {
      await models.LocalSystemFact.destroy({
        where: { key: FACT_MSUPPLY_MED_INTEGRATION_ENABLED_AT },
        force: true,
      });

      // These will be considered historical data, so should not be processed
      await createMedicationDispenses(models, {
        facilityId,
        encounterId,
        orderingClinicianId: clinicianId,
        dispensedByUserId,
        medicationId,
        count: 2,
      });

      const task = new mSupplyMedIntegrationProcessor(context);
      await task.run();

      expect(fetchWithRetryBackoff).not.toHaveBeenCalled();
      const logCount = await models.MSupplyPushLog.count();
      expect(logCount).toBe(0);
    });
  });

  describe('when one batch of medications to process', () => {
    it('authenticates, posts one batch and creates success log', async () => {
      await createMedicationDispenses(models, {
        facilityId,
        encounterId,
        orderingClinicianId: clinicianId,
        dispensedByUserId,
        medicationId,
        count: 2,
      });

      mockAuthResponse();
      mockPostResponse(true, 'Batch received');

      const task = new mSupplyMedIntegrationProcessor(context);
      await task.run();

      expect(fetchWithRetryBackoff).toHaveBeenCalledTimes(2);
      const successLog = await models.MSupplyPushLog.findOne({
        where: { status: 'success' },
        order: [['createdAt', 'DESC']],
      });
      expect(successLog).not.toBeNull();
      expect(successLog.message).toBe('Batch received');
      expect(sleepAsync).not.toHaveBeenCalled();
    });
  });

  describe('when more than one batch', () => {
    it('posts multiple batches with sleep between and creates a log per batch', async () => {
      const successCountBefore = await models.MSupplyPushLog.count({
        where: { status: 'success' },
      });

      await createMedicationDispenses(models, {
        facilityId,
        encounterId,
        orderingClinicianId: clinicianId,
        dispensedByUserId,
        medicationId,
        count: 4,
      });

      mockAuthResponse();
      mockPostResponse(true, 'Batch 1');
      mockPostResponse(true, 'Batch 2');

      const task = new mSupplyMedIntegrationProcessor(context);
      await task.run();

      expect(fetchWithRetryBackoff).toHaveBeenCalledTimes(3);
      const successCountAfter = await models.MSupplyPushLog.count({
        where: { status: 'success' },
      });
      expect(successCountAfter - successCountBefore).toBe(2);
      expect(sleepAsync).toHaveBeenCalledTimes(1);
      expect(sleepAsync).toHaveBeenCalledWith(10);
    });
  });

  describe('when post request fails', () => {
    it('creates failed log and stops processing further batches', async () => {
      await createMedicationDispenses(models, {
        facilityId,
        encounterId,
        orderingClinicianId: clinicianId,
        dispensedByUserId,
        medicationId,
        count: 2,
      });

      mockAuthResponse();
      mockPostResponse(false, 'Server error');

      const task = new mSupplyMedIntegrationProcessor(context);
      await task.run();

      const failedLog = await models.MSupplyPushLog.findOne({
        where: { status: 'failed' },
        order: [['createdAt', 'DESC']],
      });
      expect(failedLog).not.toBeNull();
      expect(failedLog.message).toBe('Server error');
      expect(fetchWithRetryBackoff).toHaveBeenCalledTimes(2);
    });

    it('saves items from response to log when present (for debug)', async () => {
      await createMedicationDispenses(models, {
        facilityId,
        encounterId,
        orderingClinicianId: clinicianId,
        dispensedByUserId,
        medicationId,
        count: 2,
      });

      const debugItems = [
        { code: 'MED001', description: 'Unknown medication code' },
        { code: 'MED002', description: 'Quantity mismatch' },
      ];
      mockAuthResponse();
      mockPostResponse(false, 'Validation failed', debugItems);

      const task = new mSupplyMedIntegrationProcessor(context);
      await task.run();

      const failedLog = await models.MSupplyPushLog.findOne({
        where: { status: 'failed' },
        order: [['createdAt', 'DESC']],
      });
      expect(failedLog).not.toBeNull();
      expect(failedLog.items).toEqual(debugItems);
    });
  });
});
