import config from 'config';
import { createTestContext } from '../utilities';
import { MSupplyStockOnHandProcessor } from '../../dist/tasks/MSupplyStockOnHandProcessor';
import { fetchWithRetryBackoff } from '@tamanu/api-client/fetchWithRetryBackoff';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { REFERENCE_TYPES, DRUG_STOCK_STATUSES, SETTINGS_SCOPES } from '@tamanu/constants';
import { settingsCache } from '@tamanu/settings';
import { fake } from '@tamanu/fake-data/fake';

jest.mock('@tamanu/utils/selectFacilityIds', () => ({
  selectFacilityIds: jest.fn(() => ['balwyn']),
}));

jest.mock('@tamanu/api-client/fetchWithRetryBackoff');

const FACILITY_ID = 'balwyn';

const INTEGRATION_SETTINGS = {
  host: 'https://msupply.example.com',
  storeId: 'store-1',
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
};

function mockAuthResponse(token = 'test-token') {
  fetchWithRetryBackoff.mockResolvedValueOnce({
    json: () =>
      Promise.resolve({
        data: { authToken: { token } },
      }),
  });
}

function mockStockLinesResponse(nodes) {
  fetchWithRetryBackoff.mockResolvedValueOnce({
    json: () =>
      Promise.resolve({
        data: { stockLines: { nodes } },
      }),
  });
}

function mockStockLinesErrorResponse(errorMessage) {
  fetchWithRetryBackoff.mockResolvedValueOnce({
    json: () =>
      Promise.resolve({
        data: null,
        errors: [{ message: errorMessage }],
      }),
  });
}

function makeStockLine({ universalCode, availableNumberOfPacks, totalNumberOfPacks, packSize }) {
  return {
    id: `stock-${Math.random().toString(36).slice(2)}`,
    item: { universalCode },
    availableNumberOfPacks,
    totalNumberOfPacks,
    packSize,
  };
}

describe('MSupplyStockOnHandProcessor', () => {
  let context;
  let models;

  beforeAll(async () => {
    config.serverFacilityId = null;
    context = await createTestContext();
    models = context.models;

    config.integrations.mSupplyMed = INTEGRATION_CONFIG;
    config.schedules.MSupplyStockOnHandProcessor = SCHEDULE_CONFIG;
    selectFacilityIds.mockReturnValue([FACILITY_ID]);

    await models.Setting.set(
      'integrations.mSupplyMed',
      INTEGRATION_SETTINGS,
      SETTINGS_SCOPES.FACILITY,
      FACILITY_ID,
    );
    settingsCache.reset();
  });

  afterAll(() => context?.close());

  beforeEach(async () => {
    jest.clearAllMocks();
    selectFacilityIds.mockReturnValue([FACILITY_ID]);
    config.integrations.mSupplyMed = INTEGRATION_CONFIG;
    config.schedules.MSupplyStockOnHandProcessor = SCHEDULE_CONFIG;

    await models.Setting.set(
      'integrations.mSupplyMed',
      INTEGRATION_SETTINGS,
      SETTINGS_SCOPES.FACILITY,
      FACILITY_ID,
    );
    settingsCache.reset();
  });

  describe('skips when not configured', () => {
    it('skips when integration is disabled', async () => {
      config.integrations.mSupplyMed = { ...INTEGRATION_CONFIG, enabled: false };

      const task = new MSupplyStockOnHandProcessor(context);
      await task.run();

      expect(fetchWithRetryBackoff).not.toHaveBeenCalled();
    });

    it('skips on omni server', async () => {
      selectFacilityIds.mockReturnValue(['facility-a', 'facility-b']);

      const task = new MSupplyStockOnHandProcessor(context);
      await task.run();

      expect(fetchWithRetryBackoff).not.toHaveBeenCalled();
    });

    it('skips when host is missing', async () => {
      await models.Setting.set(
        'integrations.mSupplyMed',
        { ...INTEGRATION_SETTINGS, host: '' },
        SETTINGS_SCOPES.FACILITY,
        FACILITY_ID,
      );
      settingsCache.reset();

      const task = new MSupplyStockOnHandProcessor(context);
      await task.run();

      expect(fetchWithRetryBackoff).not.toHaveBeenCalled();
    });

    it('skips when storeId is missing', async () => {
      await models.Setting.set(
        'integrations.mSupplyMed',
        { ...INTEGRATION_SETTINGS, storeId: '' },
        SETTINGS_SCOPES.FACILITY,
        FACILITY_ID,
      );
      settingsCache.reset();

      const task = new MSupplyStockOnHandProcessor(context);
      await task.run();

      expect(fetchWithRetryBackoff).not.toHaveBeenCalled();
    });

    it('skips when username is missing', async () => {
      config.integrations.mSupplyMed = { ...INTEGRATION_CONFIG, username: '' };

      const task = new MSupplyStockOnHandProcessor(context);
      await task.run();

      expect(fetchWithRetryBackoff).not.toHaveBeenCalled();
    });

    it('skips when password is missing', async () => {
      config.integrations.mSupplyMed = { ...INTEGRATION_CONFIG, password: '' };

      const task = new MSupplyStockOnHandProcessor(context);
      await task.run();

      expect(fetchWithRetryBackoff).not.toHaveBeenCalled();
    });
  });

  describe('authentication', () => {
    it('throws when auth returns no token', async () => {
      fetchWithRetryBackoff.mockResolvedValueOnce({
        json: () => Promise.resolve({ data: { authToken: {} } }),
      });

      const task = new MSupplyStockOnHandProcessor(context);
      await expect(task.run()).rejects.toThrow('mSupply authentication failed: no token returned');
    });
  });

  describe('stock line query errors', () => {
    it('throws when the GraphQL response contains errors', async () => {
      mockAuthResponse();
      mockStockLinesErrorResponse('Store not found');

      const task = new MSupplyStockOnHandProcessor(context);
      await expect(task.run()).rejects.toThrow(
        'mSupply stockLines query failed: Store not found',
      );
    });
  });

  describe('stock aggregation', () => {
    it('aggregates multiple stock lines for the same universal code', () => {
      const task = new MSupplyStockOnHandProcessor(context);
      const stockLines = [
        makeStockLine({ universalCode: 'MED-001', availableNumberOfPacks: 5, totalNumberOfPacks: 10, packSize: 10 }),
        makeStockLine({ universalCode: 'MED-001', availableNumberOfPacks: 3, totalNumberOfPacks: 5, packSize: 10 }),
        makeStockLine({ universalCode: 'MED-002', availableNumberOfPacks: 2, totalNumberOfPacks: 2, packSize: 20 }),
      ];

      const result = task.aggregateStockByCode(stockLines);

      expect(result.get('MED-001')).toBe(80);
      expect(result.get('MED-002')).toBe(40);
    });

    it('skips stock lines without a universal code', () => {
      const task = new MSupplyStockOnHandProcessor(context);
      const stockLines = [
        makeStockLine({ universalCode: 'MED-001', availableNumberOfPacks: 5, totalNumberOfPacks: 10, packSize: 10 }),
        makeStockLine({ universalCode: null, availableNumberOfPacks: 3, totalNumberOfPacks: 5, packSize: 10 }),
        { id: 'no-item', item: null, availableNumberOfPacks: 1, totalNumberOfPacks: 1, packSize: 1 },
      ];

      const result = task.aggregateStockByCode(stockLines);

      expect(result.size).toBe(1);
      expect(result.get('MED-001')).toBe(50);
    });

    it('treats missing packSize as 1', () => {
      const task = new MSupplyStockOnHandProcessor(context);
      const stockLines = [
        { id: 's1', item: { universalCode: 'MED-001' }, availableNumberOfPacks: 5, totalNumberOfPacks: 10, packSize: null },
      ];

      const result = task.aggregateStockByCode(stockLines);

      expect(result.get('MED-001')).toBe(5);
    });
  });

  describe('end-to-end stock update', () => {
    let drugCode1;
    let drugCode2;
    let referenceDrugId1;
    let referenceDrugId2;

    beforeAll(async () => {
      drugCode1 = 'SOH-TEST-001';
      drugCode2 = 'SOH-TEST-002';

      const refData1 = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: REFERENCE_TYPES.DRUG,
        code: drugCode1,
        name: 'SOH Test Drug 1',
      });
      const refDrug1 = await models.ReferenceDrug.create({
        ...fake(models.ReferenceDrug),
        referenceDataId: refData1.id,
      });
      referenceDrugId1 = refDrug1.id;

      const refData2 = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: REFERENCE_TYPES.DRUG,
        code: drugCode2,
        name: 'SOH Test Drug 2',
      });
      const refDrug2 = await models.ReferenceDrug.create({
        ...fake(models.ReferenceDrug),
        referenceDataId: refData2.id,
      });
      referenceDrugId2 = refDrug2.id;
    });

    afterEach(async () => {
      await models.ReferenceDrugFacility.destroy({
        where: { facilityId: FACILITY_ID },
        force: true,
      });
    });

    it('creates stock entries for matching medications', async () => {
      mockAuthResponse();
      mockStockLinesResponse([
        makeStockLine({ universalCode: drugCode1, availableNumberOfPacks: 10, totalNumberOfPacks: 10, packSize: 5 }),
        makeStockLine({ universalCode: drugCode2, availableNumberOfPacks: 0, totalNumberOfPacks: 0, packSize: 1 }),
      ]);

      const task = new MSupplyStockOnHandProcessor(context);
      await task.run();

      const stock1 = await models.ReferenceDrugFacility.findOne({
        where: { referenceDrugId: referenceDrugId1, facilityId: FACILITY_ID },
      });
      expect(stock1).not.toBeNull();
      expect(stock1.quantity).toBe(50);
      expect(stock1.stockStatus).toBe(DRUG_STOCK_STATUSES.IN_STOCK);

      const stock2 = await models.ReferenceDrugFacility.findOne({
        where: { referenceDrugId: referenceDrugId2, facilityId: FACILITY_ID },
      });
      expect(stock2).not.toBeNull();
      expect(stock2.quantity).toBe(0);
      expect(stock2.stockStatus).toBe(DRUG_STOCK_STATUSES.OUT_OF_STOCK);
    });

    it('updates existing stock entries on subsequent runs', async () => {
      await models.ReferenceDrugFacility.bulkCreate([{
        referenceDrugId: referenceDrugId1,
        facilityId: FACILITY_ID,
        quantity: 100,
        stockStatus: DRUG_STOCK_STATUSES.IN_STOCK,
      }]);

      mockAuthResponse();
      mockStockLinesResponse([
        makeStockLine({ universalCode: drugCode1, availableNumberOfPacks: 2, totalNumberOfPacks: 2, packSize: 5 }),
      ]);

      const task = new MSupplyStockOnHandProcessor(context);
      await task.run();

      const stock = await models.ReferenceDrugFacility.findOne({
        where: { referenceDrugId: referenceDrugId1, facilityId: FACILITY_ID },
      });
      expect(stock.quantity).toBe(10);
      expect(stock.stockStatus).toBe(DRUG_STOCK_STATUSES.IN_STOCK);
    });

    it('skips medications without a matching reference data code', async () => {
      mockAuthResponse();
      mockStockLinesResponse([
        makeStockLine({ universalCode: 'NON-EXISTENT-CODE', availableNumberOfPacks: 99, totalNumberOfPacks: 99, packSize: 1 }),
        makeStockLine({ universalCode: drugCode1, availableNumberOfPacks: 3, totalNumberOfPacks: 3, packSize: 1 }),
      ]);

      const task = new MSupplyStockOnHandProcessor(context);
      await task.run();

      const allStock = await models.ReferenceDrugFacility.findAll({
        where: { facilityId: FACILITY_ID },
      });
      expect(allStock).toHaveLength(1);
      expect(allStock[0].referenceDrugId).toBe(referenceDrugId1);
      expect(allStock[0].quantity).toBe(3);
    });

    it('skips stock lines without a universal code', async () => {
      mockAuthResponse();
      mockStockLinesResponse([
        makeStockLine({ universalCode: null, availableNumberOfPacks: 50, totalNumberOfPacks: 50, packSize: 1 }),
        makeStockLine({ universalCode: drugCode1, availableNumberOfPacks: 7, totalNumberOfPacks: 7, packSize: 1 }),
      ]);

      const task = new MSupplyStockOnHandProcessor(context);
      await task.run();

      const allStock = await models.ReferenceDrugFacility.findAll({
        where: { facilityId: FACILITY_ID },
      });
      expect(allStock).toHaveLength(1);
      expect(allStock[0].quantity).toBe(7);
    });

    it('aggregates multiple stock lines for the same drug', async () => {
      mockAuthResponse();
      mockStockLinesResponse([
        makeStockLine({ universalCode: drugCode1, availableNumberOfPacks: 4, totalNumberOfPacks: 4, packSize: 10 }),
        makeStockLine({ universalCode: drugCode1, availableNumberOfPacks: 6, totalNumberOfPacks: 6, packSize: 10 }),
      ]);

      const task = new MSupplyStockOnHandProcessor(context);
      await task.run();

      const stock = await models.ReferenceDrugFacility.findOne({
        where: { referenceDrugId: referenceDrugId1, facilityId: FACILITY_ID },
      });
      expect(stock.quantity).toBe(100);
      expect(stock.stockStatus).toBe(DRUG_STOCK_STATUSES.IN_STOCK);
    });

    it('handles empty stock lines response gracefully', async () => {
      mockAuthResponse();
      mockStockLinesResponse([]);

      const task = new MSupplyStockOnHandProcessor(context);
      await task.run();

      const allStock = await models.ReferenceDrugFacility.findAll({
        where: { facilityId: FACILITY_ID },
      });
      expect(allStock).toHaveLength(0);
    });
  });
});
