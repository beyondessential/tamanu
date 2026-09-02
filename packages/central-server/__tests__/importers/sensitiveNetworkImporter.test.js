import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { utils } from 'xlsx';

import { GENERAL_IMPORTABLE_DATA_TYPES } from '@tamanu/constants/importable';
import { importerTransaction } from '../../app/admin/importer/importerEndpoint';
import { referenceDataImporter } from '../../app/admin/referenceDataImporter';
import { createTestContext } from '../utilities';

// the importer can take a little while
vi.setConfig({ testTimeout: 50000 });

// Asserted as text rather than imported: the constant is deliberately not exported from
// models/Facility, because initDatabase treats every export of a model file as a model class.
const SENSITIVE_NETWORK_IS_FIXED_MESSAGE =
  'a facility cannot change sensitive network, only a new facility can be enrolled in a network';

// A null cell is genuinely blank — aoa_to_sheet writes no cell record for it, which is what a user
// leaving a spreadsheet cell empty produces. An empty string is a different case, covered explicitly.
const buildWorkbook = sheets => {
  const workbook = utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    utils.book_append_sheet(workbook, utils.aoa_to_sheet(rows), name);
  }
  return workbook;
};

// SensitiveNetwork.id is a UUID column, unlike the string primary keys every other reference data
// sheet uses, so fixture ids have to be well-formed UUIDs rather than readable slugs.
const NETWORK_A = '11111111-1111-0000-0000-000000000001';
const NETWORK_B = '22222222-2222-0000-0000-000000000002';
const NETWORK_MISSING = '99999999-9999-0000-0000-000000000099';

const networkSheet = rows => [['id', 'code', 'name'], ...rows];
const facilitySheet = rows => [['id', 'code', 'name', 'sensitiveNetworkId'], ...rows];

// spec: specs/sync/sensitive-networks.md
describe('Sensitive network import', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    // Facilities reference networks, so they go first.
    await models.Facility.destroy({ where: {}, force: true });
    await models.SensitiveNetwork.destroy({ where: {}, force: true });
  });

  const doImport = ({ sheets, ...options }) =>
    importerTransaction({
      importer: referenceDataImporter,
      workbook: buildWorkbook(sheets),
      models,
      includedDataTypes: GENERAL_IMPORTABLE_DATA_TYPES,
      checkPermission: () => true,
      ...options,
    });

  const seedNetwork = (id, code = id.slice(0, 8), name = id.slice(0, 8)) =>
    models.SensitiveNetwork.create({ id, code, name });

  const seedFacility = (id, sensitiveNetworkId = null) =>
    models.Facility.create({ id, code: id, name: id, sensitiveNetworkId });

  describe('importing networks', () => {
    it('creates a network from its id, code and name', async () => {
      const { errors } = await doImport({
        sheets: { 'Sensitive Networks': networkSheet([[NETWORK_A, 'NETA', 'Network A']]) },
      });

      expect(errors).toEqual([]);
      const network = await models.SensitiveNetwork.findByPk(NETWORK_A);
      expect(network).toMatchObject({ code: 'NETA', name: 'Network A' });
    });

    it('fails a row with no code', async () => {
      const { errors } = await doImport({
        sheets: { 'Sensitive Networks': networkSheet([[NETWORK_A, null, 'Network A']]) },
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(await models.SensitiveNetwork.findByPk(NETWORK_A)).toBeNull();
    });

    it('fails a row with no name', async () => {
      const { errors } = await doImport({
        sheets: { 'Sensitive Networks': networkSheet([[NETWORK_A, 'NETA', null]]) },
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(await models.SensitiveNetwork.findByPk(NETWORK_A)).toBeNull();
    });

    it('fails a row whose code duplicates another network', async () => {
      await seedNetwork(NETWORK_A, 'NETA', 'Network A');

      const { errors } = await doImport({
        sheets: { 'Sensitive Networks': networkSheet([[NETWORK_B, 'NETA', 'Network B']]) },
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(await models.SensitiveNetwork.findByPk(NETWORK_B)).toBeNull();
    });

    it('fails a row whose name duplicates another network', async () => {
      await seedNetwork(NETWORK_A, 'NETA', 'Network A');

      const { errors } = await doImport({
        sheets: { 'Sensitive Networks': networkSheet([[NETWORK_B, 'NETB', 'Network A']]) },
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(await models.SensitiveNetwork.findByPk(NETWORK_B)).toBeNull();
    });

    it('updates a network re-imported under its own id', async () => {
      await seedNetwork(NETWORK_A, 'NETA', 'Network A');

      const { errors } = await doImport({
        sheets: { 'Sensitive Networks': networkSheet([[NETWORK_A, 'RENAMED', 'Renamed network']]) },
      });

      expect(errors).toEqual([]);
      const network = await models.SensitiveNetwork.findByPk(NETWORK_A);
      expect(network).toMatchObject({ code: 'RENAMED', name: 'Renamed network' });
    });

    it('accepts the sheet under its singular tab name', async () => {
      const { errors } = await doImport({
        sheets: { 'Sensitive Network': networkSheet([[NETWORK_A, 'NETA', 'Network A']]) },
      });

      expect(errors).toEqual([]);
      expect(await models.SensitiveNetwork.findByPk(NETWORK_A)).not.toBeNull();
    });

    it('checks create and write permission against the network type', async () => {
      const checkPermission = vi.fn();

      await doImport({
        sheets: { 'Sensitive Networks': networkSheet([[NETWORK_A, 'NETA', 'Network A']]) },
        checkPermission,
      });

      // The noun the importer derives is what a role has to grant, so the exact spelling matters.
      expect(checkPermission).toHaveBeenCalledWith('create', 'SensitiveNetwork');
      expect(checkPermission).toHaveBeenCalledWith('write', 'SensitiveNetwork');
    });

    it('allows a role to be granted that permission', () => {
      // Without a PERMISSION_SCHEMA entry the noun is not in the schema, so the admin panel refuses
      // to define the permission and no role can be granted what the importer goes on to demand.
      for (const verb of ['create', 'write']) {
        expect(() =>
          models.Permission.validatePermissionSchema(verb, 'SensitiveNetwork', 'some-role'),
        ).not.toThrow();
      }
    });
  });

  describe('enrolling facilities', () => {
    it('creates a facility already enrolled in an existing network', async () => {
      await seedNetwork(NETWORK_A);

      const { errors } = await doImport({
        sheets: { Facilities: facilitySheet([['fac-a', 'FACA', 'Facility A', NETWORK_A]]) },
      });

      expect(errors).toEqual([]);
      const facility = await models.Facility.findByPk('fac-a');
      expect(facility.sensitiveNetworkId).toBe(NETWORK_A);
    });

    it('defines a network and creates facilities into it in one file', async () => {
      const { errors } = await doImport({
        sheets: {
          'Sensitive Networks': networkSheet([[NETWORK_A, 'NETA', 'Network A']]),
          Facilities: facilitySheet([
            ['fac-a', 'FACA', 'Facility A', NETWORK_A],
            ['fac-b', 'FACB', 'Facility B', NETWORK_A],
          ]),
        },
      });

      expect(errors).toEqual([]);
      const members = await models.Facility.findAll({ where: { sensitiveNetworkId: NETWORK_A } });
      expect(members.map(f => f.id).sort()).toEqual(['fac-a', 'fac-b']);
    });

    it('fails a facility row naming a network that does not exist', async () => {
      const { errors } = await doImport({
        sheets: { Facilities: facilitySheet([['fac-a', 'FACA', 'Facility A', NETWORK_MISSING]]) },
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(await models.Facility.findByPk('fac-a')).toBeNull();
    });

    it('creates a facility with a blank network cell in no network', async () => {
      const { errors } = await doImport({
        sheets: { Facilities: facilitySheet([['fac-a', 'FACA', 'Facility A', null]]) },
      });

      expect(errors).toEqual([]);
      const facility = await models.Facility.findByPk('fac-a');
      expect(facility.sensitiveNetworkId).toBeNull();
    });
  });

  describe('refusing membership changes', () => {
    it('refuses enrolling an existing facility that belongs to no network', async () => {
      await seedNetwork(NETWORK_A);
      await seedFacility('fac-a');

      const { errors } = await doImport({
        sheets: { Facilities: facilitySheet([['fac-a', 'fac-a', 'fac-a', NETWORK_A]]) },
      });

      expect(errors.length).toBeGreaterThan(0);
      const facility = await models.Facility.findByPk('fac-a');
      expect(facility.sensitiveNetworkId).toBeNull();
    });

    it('refuses moving an existing facility to a different network', async () => {
      await seedNetwork(NETWORK_A);
      await seedNetwork(NETWORK_B);
      await seedFacility('fac-a', NETWORK_A);

      const { errors } = await doImport({
        sheets: { Facilities: facilitySheet([['fac-a', 'fac-a', 'fac-a', NETWORK_B]]) },
      });

      expect(errors.length).toBeGreaterThan(0);
      const facility = await models.Facility.findByPk('fac-a');
      expect(facility.sensitiveNetworkId).toBe(NETWORK_A);
    });

    it('refuses moving a facility that is the sole member of its network', async () => {
      await seedNetwork(NETWORK_A);
      await seedNetwork(NETWORK_B);
      await seedFacility('fac-a', NETWORK_A);

      expect(await models.Facility.count({ where: { sensitiveNetworkId: NETWORK_A } })).toBe(1);

      const { errors } = await doImport({
        sheets: { Facilities: facilitySheet([['fac-a', 'fac-a', 'fac-a', NETWORK_B]]) },
      });

      expect(errors.length).toBeGreaterThan(0);
    });

    it('refuses enrolling a soft-deleted facility rather than restoring it into a network', async () => {
      await seedNetwork(NETWORK_A);
      const facility = await seedFacility('fac-a');
      await facility.destroy();

      const { errors } = await doImport({
        sheets: { Facilities: facilitySheet([['fac-a', 'fac-a', 'fac-a', NETWORK_A]]) },
      });

      expect(errors.length).toBeGreaterThan(0);
      const reloaded = await models.Facility.findByPk('fac-a', { paranoid: false });
      expect(reloaded.sensitiveNetworkId).toBeNull();
    });

    it('names the facility and says only a new facility can be enrolled', async () => {
      await seedNetwork(NETWORK_A);
      await seedFacility('fac-a');

      const { errors } = await doImport({
        sheets: { Facilities: facilitySheet([['fac-a', 'fac-a', 'fac-a', NETWORK_A]]) },
      });

      const message = errors.map(error => error.message).join('\n');
      expect(message).toContain(SENSITIVE_NETWORK_IS_FIXED_MESSAGE);
      expect(message).toContain('fac-a');
    });

    it('abandons the whole file when one facility row is refused', async () => {
      await seedNetwork(NETWORK_A);
      await seedFacility('fac-a');

      const { errors } = await doImport({
        sheets: {
          'Sensitive Networks': networkSheet([[NETWORK_B, 'NETB', 'Network B']]),
          Facilities: facilitySheet([
            ['fac-a', 'fac-a', 'fac-a', NETWORK_A],
            ['fac-new', 'FACNEW', 'Facility New', null],
          ]),
        },
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(await models.SensitiveNetwork.findByPk(NETWORK_B)).toBeNull();
      expect(await models.Facility.findByPk('fac-new')).toBeNull();
    });

    it('reports the refusal when validating without importing', async () => {
      await seedNetwork(NETWORK_A);
      await seedFacility('fac-a');

      const { errors, didntSendReason } = await doImport({
        sheets: { Facilities: facilitySheet([['fac-a', 'fac-a', 'fac-a', NETWORK_A]]) },
        dryRun: true,
      });

      expect(didntSendReason).toBe('validationFailed');
      expect(errors.length).toBeGreaterThan(0);
      const facility = await models.Facility.findByPk('fac-a');
      expect(facility.sensitiveNetworkId).toBeNull();
    });
  });

  describe('an empty network cell is not a removal', () => {
    it('keeps membership when the facility sheet has no network column at all', async () => {
      await seedNetwork(NETWORK_A);
      await seedFacility('fac-a', NETWORK_A);

      const { errors } = await doImport({
        sheets: {
          Facilities: [
            ['id', 'code', 'name'],
            ['fac-a', 'fac-a', 'Renamed facility'],
          ],
        },
      });

      expect(errors).toEqual([]);
      const facility = await models.Facility.findByPk('fac-a');
      expect(facility.sensitiveNetworkId).toBe(NETWORK_A);
      expect(facility.name).toBe('Renamed facility');
    });

    it('keeps membership when the network cell is blank', async () => {
      await seedNetwork(NETWORK_A);
      await seedFacility('fac-a', NETWORK_A);

      const { errors } = await doImport({
        sheets: { Facilities: facilitySheet([['fac-a', 'fac-a', 'fac-a', null]]) },
      });

      expect(errors).toEqual([]);
      const facility = await models.Facility.findByPk('fac-a');
      expect(facility.sensitiveNetworkId).toBe(NETWORK_A);
    });

    it('keeps membership when the network cell is an empty string', async () => {
      await seedNetwork(NETWORK_A);
      await seedFacility('fac-a', NETWORK_A);

      const { errors } = await doImport({
        sheets: { Facilities: facilitySheet([['fac-a', 'fac-a', 'fac-a', '']]) },
      });

      expect(errors).toEqual([]);
      const facility = await models.Facility.findByPk('fac-a');
      expect(facility.sensitiveNetworkId).toBe(NETWORK_A);
    });

    it('imports a facility sheet with no network column for a facility in no network', async () => {
      await seedFacility('fac-a');

      const { errors } = await doImport({
        sheets: {
          Facilities: [
            ['id', 'code', 'name'],
            ['fac-a', 'fac-a', 'Renamed facility'],
          ],
        },
      });

      expect(errors).toEqual([]);
      const facility = await models.Facility.findByPk('fac-a');
      expect(facility.sensitiveNetworkId).toBeNull();
    });
  });

  describe('re-importing an unchanged file', () => {
    it('accepts a facility row naming the network it already belongs to', async () => {
      await seedNetwork(NETWORK_A);
      await seedFacility('fac-a', NETWORK_A);

      const { errors } = await doImport({
        sheets: { Facilities: facilitySheet([['fac-a', 'fac-a', 'fac-a', NETWORK_A]]) },
      });

      expect(errors).toEqual([]);
      const facility = await models.Facility.findByPk('fac-a');
      expect(facility.sensitiveNetworkId).toBe(NETWORK_A);
    });

    it('accepts the same file imported twice', async () => {
      const sheets = {
        'Sensitive Networks': networkSheet([[NETWORK_A, 'NETA', 'Network A']]),
        Facilities: facilitySheet([['fac-a', 'FACA', 'Facility A', NETWORK_A]]),
      };

      expect((await doImport({ sheets })).errors).toEqual([]);
      expect((await doImport({ sheets })).errors).toEqual([]);

      const facility = await models.Facility.findByPk('fac-a');
      expect(facility.sensitiveNetworkId).toBe(NETWORK_A);
    });
  });

  describe('the pre-network sensitivity column', () => {
    it('ignores an isSensitive column left over on the facility sheet', async () => {
      const { errors } = await doImport({
        sheets: {
          Facilities: [
            ['id', 'code', 'name', 'isSensitive'],
            ['fac-a', 'FACA', 'Facility A', 'true'],
          ],
        },
      });

      expect(errors).toEqual([]);
      const facility = await models.Facility.findByPk('fac-a');
      expect(facility.sensitiveNetworkId).toBeNull();
      expect(facility.dataValues.isSensitive).toBeUndefined();
    });
  });
});
