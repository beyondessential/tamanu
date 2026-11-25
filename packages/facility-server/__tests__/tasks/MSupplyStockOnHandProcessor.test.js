import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import config from 'config';
import { createTestContext } from '../utilities';
import {
  ITEMS_PAGE_SIZE,
  MSupplyStockOnHandProcessor,
} from '../../app/tasks/MSupplyStockOnHandProcessor';
import { fetchWithRetryBackoff } from '@tamanu/api-client/fetchWithRetryBackoff';
import { getServerFacilityIds } from '../../app/serverConfig';
import { REFERENCE_TYPES, DRUG_STOCK_STATUSES, SETTINGS_SCOPES } from '@tamanu/constants';
import { settingsCache } from '@tamanu/settings';
import { fake } from '@tamanu/fake-data/fake';

vi.mock('../../app/serverConfig', async () => ({
  ...(await vi.importActual('../../app/serverConfig')),
  getServerFacilityIds: vi.fn(() => ['balwyn']),
}));

vi.mock('@tamanu/api-client/fetchWithRetryBackoff');

const FACILITY_ID = 'balwyn';

const INTEGRATION_SETTINGS = {
  enabled: true,
  stockOnHandEnabled: true,
  host: 'https://msupply.example.com',
  username: 'test-user',
  password: 'test-pass',
  storeId: 'store-1',
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

function mockItemsResponse(nodes, totalCount = nodes.length) {
  fetchWithRetryBackoff.mockResolvedValueOnce({
    json: () =>
      Promise.resolve({
        data: { items: { totalCount, nodes } },
      }),
  });
}

function mockItemsErrorResponse(errorMessage) {
  fetchWithRetryBackoff.mockResolvedValueOnce({
    json: () =>
      Promise.resolve({
        data: null,
        errors: [{ message: errorMessage }],
      }),
  });
}

describe('MSupplyStockOnHandProcessor', () => {
  let context;
  let models;

  beforeAll(async () => {
    config.serverFacilityId = null;
    context = await createTestContext();
    models = context.models;

    config.schedules.mSupplyStockOnHandProcessor = SCHEDULE_CONFIG;
    getServerFacilityIds.mockReturnValue([FACILITY_ID]);

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
    vi.clearAllMocks();
    getServerFacilityIds.mockReturnValue([FACILITY_ID]);
    config.schedules.mSupplyStockOnHandProcessor = SCHEDULE_CONFIG;

    await models.Setting.set(
      'integrations.mSupplyMed',
      INTEGRATION_SETTINGS,
      SETTINGS_SCOPES.FACILITY,
      FACILITY_ID,
    );
    settingsCache.reset();
  });

  describe('skips when not configured', () => {
    it('skips when stock on hand sync is disabled', async () => {
      await models.Setting.set(
        'integrations.mSupplyMed',
        { ...INTEGRATION_SETTINGS, stockOnHandEnabled: false },
        SETTINGS_SCOPES.FACILITY,
        FACILITY_ID,
      );
      settingsCache.reset();

      const task = new MSupplyStockOnHandProcessor(context);
      await task.run();

      expect(fetchWithRetryBackoff).not.toHaveBeenCalled();
    });

    it('skips on omni server', async () => {
      getServerFacilityIds.mockReturnValue(['facility-a', 'facility-b']);

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
      await models.Setting.set(
        'integrations.mSupplyMed',
        { ...INTEGRATION_SETTINGS, username: '' },
        SETTINGS_SCOPES.FACILITY,
        FACILITY_ID,
      );
      settingsCache.reset();

      const task = new MSupplyStockOnHandProcessor(context);
      await task.run();

      expect(fetchWithRetryBackoff).not.toHaveBeenCalled();
    });

    it('skips when password is missing', async () => {
      await models.Setting.set(
        'integrations.mSupplyMed',
        { ...INTEGRATION_SETTINGS, password: '' },
        SETTINGS_SCOPES.FACILITY,
        FACILITY_ID,
      );
      settingsCache.reset();

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

  describe('items query errors', () => {
    it('throws when the GraphQL response contains errors', async () => {
      mockAuthResponse();
      mockItemsErrorResponse('Store not found');

      const task = new MSupplyStockOnHandProcessor(context);
      await expect(task.run()).rejects.toThrow('mSupply items query failed: Store not found');
    });
  });

  describe('stock aggregation', () => {
    it('aggregates multiple items with the same code', () => {
      const task = new MSupplyStockOnHandProcessor(context);
      const items = [
        { code: 'MED-001', availableStockOnHand: 50 },
        { code: 'MED-001', availableStockOnHand: 30 },
        { code: 'MED-002', availableStockOnHand: 40 },
      ];

      const result = task.aggregateStockByCode(items);

      expect(result.get('MED-001')).toBe(80);
      expect(result.get('MED-002')).toBe(40);
    });

    it('skips items without a code', () => {
      const task = new MSupplyStockOnHandProcessor(context);
      const items = [
        { code: 'MED-001', availableStockOnHand: 50 },
        { code: null, availableStockOnHand: 30 },
      ];

      const result = task.aggregateStockByCode(items);

      expect(result.size).toBe(1);
      expect(result.get('MED-001')).toBe(50);
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

    it('updates existing stock entries for matching medications', async () => {
      await models.ReferenceDrugFacility.bulkCreate([
        {
          referenceDrugId: referenceDrugId1,
          facilityId: FACILITY_ID,
          quantity: null,
          stockStatus: DRUG_STOCK_STATUSES.UNKNOWN,
        },
        {
          referenceDrugId: referenceDrugId2,
          facilityId: FACILITY_ID,
          quantity: 0,
          stockStatus: DRUG_STOCK_STATUSES.OUT_OF_STOCK,
        },
      ]);

      mockAuthResponse();
      mockItemsResponse([
        { code: drugCode1, availableStockOnHand: 50 },
        { code: drugCode2, availableStockOnHand: 0 },
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
      await models.ReferenceDrugFacility.bulkCreate([
        {
          referenceDrugId: referenceDrugId1,
          facilityId: FACILITY_ID,
          quantity: 100,
          stockStatus: DRUG_STOCK_STATUSES.IN_STOCK,
        },
      ]);

      mockAuthResponse();
      mockItemsResponse([{ code: drugCode1, availableStockOnHand: 10 }]);

      const task = new MSupplyStockOnHandProcessor(context);
      await task.run();

      const stock = await models.ReferenceDrugFacility.findOne({
        where: { referenceDrugId: referenceDrugId1, facilityId: FACILITY_ID },
      });
      expect(stock.quantity).toBe(10);
      expect(stock.stockStatus).toBe(DRUG_STOCK_STATUSES.IN_STOCK);
    });

    it('only writes stock entries that have changed', async () => {
      await models.ReferenceDrugFacility.bulkCreate([
        {
          referenceDrugId: referenceDrugId1,
          facilityId: FACILITY_ID,
          quantity: 10,
          stockStatus: DRUG_STOCK_STATUSES.IN_STOCK,
        },
        {
          referenceDrugId: referenceDrugId2,
          facilityId: FACILITY_ID,
          quantity: 0,
          stockStatus: DRUG_STOCK_STATUSES.OUT_OF_STOCK,
        },
      ]);

      const task = new MSupplyStockOnHandProcessor(context);
      const { updated } = await task.updateStockForFacility(
        new Map([
          [drugCode1, 10],
          [drugCode2, 5],
        ]),
        FACILITY_ID,
      );

      expect(updated).toBe(1);
    });

    it('skips medications without a matching reference data code', async () => {
      await models.ReferenceDrugFacility.bulkCreate([
        {
          referenceDrugId: referenceDrugId1,
          facilityId: FACILITY_ID,
          quantity: null,
          stockStatus: DRUG_STOCK_STATUSES.UNKNOWN,
        },
      ]);

      mockAuthResponse();
      mockItemsResponse([
        { code: 'NON-EXISTENT-CODE', availableStockOnHand: 99 },
        { code: drugCode1, availableStockOnHand: 3 },
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

    it('leaves medications that mSupply does not list as unknown', async () => {
      await models.ReferenceDrugFacility.bulkCreate([
        {
          referenceDrugId: referenceDrugId1,
          facilityId: FACILITY_ID,
          quantity: null,
          stockStatus: DRUG_STOCK_STATUSES.UNKNOWN,
        },
        {
          referenceDrugId: referenceDrugId2,
          facilityId: FACILITY_ID,
          quantity: null,
          stockStatus: DRUG_STOCK_STATUSES.UNKNOWN,
        },
      ]);

      mockAuthResponse();
      mockItemsResponse([{ code: drugCode1, availableStockOnHand: 5 }]);

      const task = new MSupplyStockOnHandProcessor(context);
      await task.run();

      const stock = await models.ReferenceDrugFacility.findOne({
        where: { referenceDrugId: referenceDrugId2, facilityId: FACILITY_ID },
      });
      expect(stock.quantity).toBeNull();
      expect(stock.stockStatus).toBe(DRUG_STOCK_STATUSES.UNKNOWN);
    });

    it('skips items without a code', async () => {
      await models.ReferenceDrugFacility.bulkCreate([
        {
          referenceDrugId: referenceDrugId1,
          facilityId: FACILITY_ID,
          quantity: null,
          stockStatus: DRUG_STOCK_STATUSES.UNKNOWN,
        },
      ]);

      mockAuthResponse();
      mockItemsResponse([
        { code: null, availableStockOnHand: 50 },
        { code: drugCode1, availableStockOnHand: 7 },
      ]);

      const task = new MSupplyStockOnHandProcessor(context);
      await task.run();

      const allStock = await models.ReferenceDrugFacility.findAll({
        where: { facilityId: FACILITY_ID },
      });
      expect(allStock).toHaveLength(1);
      expect(allStock[0].quantity).toBe(7);
    });

    it('aggregates multiple items with the same code', async () => {
      await models.ReferenceDrugFacility.bulkCreate([
        {
          referenceDrugId: referenceDrugId1,
          facilityId: FACILITY_ID,
          quantity: null,
          stockStatus: DRUG_STOCK_STATUSES.UNKNOWN,
        },
      ]);

      mockAuthResponse();
      mockItemsResponse([
        { code: drugCode1, availableStockOnHand: 40 },
        { code: drugCode1, availableStockOnHand: 60 },
      ]);

      const task = new MSupplyStockOnHandProcessor(context);
      await task.run();

      const stock = await models.ReferenceDrugFacility.findOne({
        where: { referenceDrugId: referenceDrugId1, facilityId: FACILITY_ID },
      });
      expect(stock.quantity).toBe(100);
      expect(stock.stockStatus).toBe(DRUG_STOCK_STATUSES.IN_STOCK);
    });

    it('handles empty items response gracefully', async () => {
      mockAuthResponse();
      mockItemsResponse([]);

      const task = new MSupplyStockOnHandProcessor(context);
      await task.run();

      const allStock = await models.ReferenceDrugFacility.findAll({
        where: { facilityId: FACILITY_ID },
      });
      expect(allStock).toHaveLength(0);
    });

    it('pages through items until totalCount is reached', async () => {
      await models.ReferenceDrugFacility.bulkCreate([
        {
          referenceDrugId: referenceDrugId1,
          facilityId: FACILITY_ID,
          quantity: null,
          stockStatus: DRUG_STOCK_STATUSES.UNKNOWN,
        },
        {
          referenceDrugId: referenceDrugId2,
          facilityId: FACILITY_ID,
          quantity: null,
          stockStatus: DRUG_STOCK_STATUSES.UNKNOWN,
        },
      ]);

      const totalCount = ITEMS_PAGE_SIZE + 1;
      const otherItems = Array.from({ length: ITEMS_PAGE_SIZE - 1 }, (_, index) => ({
        code: `NOT-IN-TAMANU-${index}`,
        availableStockOnHand: 1,
      }));
      mockAuthResponse();
      mockItemsResponse([...otherItems, { code: drugCode1, availableStockOnHand: 7 }], totalCount);
      mockItemsResponse([{ code: drugCode2, availableStockOnHand: 0 }], totalCount);

      const task = new MSupplyStockOnHandProcessor(context);
      await task.run();

      const requestedPages = fetchWithRetryBackoff.mock.calls
        .slice(1) // the first call authenticates
        .map(([, { body }]) => JSON.parse(body).variables.page);
      expect(requestedPages).toEqual([
        { first: ITEMS_PAGE_SIZE, offset: 0 },
        { first: ITEMS_PAGE_SIZE, offset: ITEMS_PAGE_SIZE },
      ]);

      const stock1 = await models.ReferenceDrugFacility.findOne({
        where: { referenceDrugId: referenceDrugId1, facilityId: FACILITY_ID },
      });
      expect(stock1.quantity).toBe(7);
      expect(stock1.stockStatus).toBe(DRUG_STOCK_STATUSES.IN_STOCK);

      const stock2 = await models.ReferenceDrugFacility.findOne({
        where: { referenceDrugId: referenceDrugId2, facilityId: FACILITY_ID },
      });
      expect(stock2.quantity).toBe(0);
      expect(stock2.stockStatus).toBe(DRUG_STOCK_STATUSES.OUT_OF_STOCK);
    });
  });
});
