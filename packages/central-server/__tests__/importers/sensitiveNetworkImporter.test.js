import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { utils } from 'xlsx';

import { GENERAL_IMPORTABLE_DATA_TYPES } from '@tamanu/constants/importable';
import { SENSITIVE_NETWORK_IS_FIXED_MESSAGE } from '@tamanu/database/models/Facility';

import { importerTransaction } from '../../app/admin/importer/importerEndpoint';
import { referenceDataImporter } from '../../app/admin/referenceDataImporter';
import { createTestContext } from '../utilities';

// the importer can take a little while
vi.setConfig({ testTimeout: 50000 });

// A null cell is genuinely blank — aoa_to_sheet writes no cell record for it, which is what a user
// leaving a spreadsheet cell empty produces. An empty string is a different case, covered explicitly.
const buildWorkbook = sheets => {
  const workbook = utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    utils.book_append_sheet(workbook, utils.aoa_to_sheet(rows), name);
  }
  return workbook;
};

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

  const seedNetwork = (id, code = id, name = id) =>
    models.SensitiveNetwork.create({ id, code, name });

  const seedFacility = (id, sensitiveNetworkId = null) =>
    models.Facility.create({ id, code: id, name: id, sensitiveNetworkId });

  describe('importing networks', () => {
    it('creates a network from its id, code and name', async () => {
      const { errors } = await doImport({
        sheets: { 'Sensitive Networks': networkSheet([['net-a', 'NETA', 'Network A']]) },
      });

      expect(errors).toEqual([]);
      const network = await models.SensitiveNetwork.findByPk('net-a');
      expect(network).toMatchObject({ code: 'NETA', name: 'Network A' });
    });

    it('fails a row with no code', async () => {
      const { errors } = await doImport({
        sheets: { 'Sensitive Networks': networkSheet([['net-a', null, 'Network A']]) },
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(await models.SensitiveNetwork.findByPk('net-a')).toBeNull();
    });

    it('fails a row with no name', async () => {
      const { errors } = await doImport({
        sheets: { 'Sensitive Networks': networkSheet([['net-a', 'NETA', null]]) },
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(await models.SensitiveNetwork.findByPk('net-a')).toBeNull();
    });

    it('fails a row whose code duplicates another network', async () => {
      await seedNetwork('net-a', 'NETA', 'Network A');

      const { errors } = await doImport({
        sheets: { 'Sensitive Networks': networkSheet([['net-b', 'NETA', 'Network B']]) },
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(await models.SensitiveNetwork.findByPk('net-b')).toBeNull();
    });

    it('fails a row whose name duplicates another network', async () => {
      await seedNetwork('net-a', 'NETA', 'Network A');

      const { errors } = await doImport({
        sheets: { 'Sensitive Networks': networkSheet([['net-b', 'NETB', 'Network A']]) },
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(await models.SensitiveNetwork.findByPk('net-b')).toBeNull();
    });

    it('updates a network re-imported under its own id', async () => {
      await seedNetwork('net-a', 'NETA', 'Network A');

      const { errors } = await doImport({
        sheets: { 'Sensitive Networks': networkSheet([['net-a', 'RENAMED', 'Renamed network']]) },
      });

      expect(errors).toEqual([]);
      const network = await models.SensitiveNetwork.findByPk('net-a');
      expect(network).toMatchObject({ code: 'RENAMED', name: 'Renamed network' });
    });

    it('accepts the sheet under its singular tab name', async () => {
      const { errors } = await doImport({
        sheets: { 'Sensitive Network': networkSheet([['net-a', 'NETA', 'Network A']]) },
      });

      expect(errors).toEqual([]);
      expect(await models.SensitiveNetwork.findByPk('net-a')).not.toBeNull();
    });

    it('checks create and write permission against the network type', async () => {
      const checkPermission = vi.fn();

      await doImport({
        sheets: { 'Sensitive Networks': networkSheet([['net-a', 'NETA', 'Network A']]) },
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
      await seedNetwork('net-a');

      const { errors } = await doImport({
        sheets: { Facilities: facilitySheet([['fac-a', 'FACA', 'Facility A', 'net-a']]) },
      });

      expect(errors).toEqual([]);
      const facility = await models.Facility.findByPk('fac-a');
      expect(facility.sensitiveNetworkId).toBe('net-a');
    });

    it('defines a network and creates facilities into it in one file', async () => {
      const { errors } = await doImport({
        sheets: {
          'Sensitive Networks': networkSheet([['net-a', 'NETA', 'Network A']]),
          Facilities: facilitySheet([
            ['fac-a', 'FACA', 'Facility A', 'net-a'],
            ['fac-b', 'FACB', 'Facility B', 'net-a'],
          ]),
        },
      });

      expect(errors).toEqual([]);
      const members = await models.Facility.findAll({ where: { sensitiveNetworkId: 'net-a' } });
      expect(members.map(f => f.id).sort()).toEqual(['fac-a', 'fac-b']);
    });

    it('fails a facility row naming a network that does not exist', async () => {
      const { errors } = await doImport({
        sheets: { Facilities: facilitySheet([['fac-a', 'FACA', 'Facility A', 'no-such-net']]) },
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
      await seedNetwork('net-a');
      await seedFacility('fac-a');

      const { errors } = await doImport({
        sheets: { Facilities: facilitySheet([['fac-a', 'fac-a', 'fac-a', 'net-a']]) },
      });

      expect(errors.length).toBeGreaterThan(0);
      const facility = await models.Facility.findByPk('fac-a');
      expect(facility.sensitiveNetworkId).toBeNull();
    });

    it('refuses moving an existing facility to a different network', async () => {
      await seedNetwork('net-a');
      await seedNetwork('net-b');
      await seedFacility('fac-a', 'net-a');

      const { errors } = await doImport({
        sheets: { Facilities: facilitySheet([['fac-a', 'fac-a', 'fac-a', 'net-b']]) },
      });

      expect(errors.length).toBeGreaterThan(0);
      const facility = await models.Facility.findByPk('fac-a');
      expect(facility.sensitiveNetworkId).toBe('net-a');
    });

    it('refuses moving a facility that is the sole member of its network', async () => {
      await seedNetwork('net-a');
      await seedNetwork('net-b');
      await seedFacility('fac-a', 'net-a');

      expect(await models.Facility.count({ where: { sensitiveNetworkId: 'net-a' } })).toBe(1);

      const { errors } = await doImport({
        sheets: { Facilities: facilitySheet([['fac-a', 'fac-a', 'fac-a', 'net-b']]) },
      });

      expect(errors.length).toBeGreaterThan(0);
    });

    it('refuses enrolling a soft-deleted facility rather than restoring it into a network', async () => {
      await seedNetwork('net-a');
      const facility = await seedFacility('fac-a');
      await facility.destroy();

      const { errors } = await doImport({
        sheets: { Facilities: facilitySheet([['fac-a', 'fac-a', 'fac-a', 'net-a']]) },
      });

      expect(errors.length).toBeGreaterThan(0);
      const reloaded = await models.Facility.findByPk('fac-a', { paranoid: false });
      expect(reloaded.sensitiveNetworkId).toBeNull();
    });

    it('names the facility and says only a new facility can be enrolled', async () => {
      await seedNetwork('net-a');
      await seedFacility('fac-a');

      const { errors } = await doImport({
        sheets: { Facilities: facilitySheet([['fac-a', 'fac-a', 'fac-a', 'net-a']]) },
      });

      const message = errors.map(error => error.message).join('\n');
      expect(message).toContain(SENSITIVE_NETWORK_IS_FIXED_MESSAGE);
      expect(message).toContain('fac-a');
    });

    it('abandons the whole file when one facility row is refused', async () => {
      await seedNetwork('net-a');
      await seedFacility('fac-a');

      const { errors } = await doImport({
        sheets: {
          'Sensitive Networks': networkSheet([['net-b', 'NETB', 'Network B']]),
          Facilities: facilitySheet([
            ['fac-a', 'fac-a', 'fac-a', 'net-a'],
            ['fac-new', 'FACNEW', 'Facility New', null],
          ]),
        },
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(await models.SensitiveNetwork.findByPk('net-b')).toBeNull();
      expect(await models.Facility.findByPk('fac-new')).toBeNull();
    });

    it('reports the refusal when validating without importing', async () => {
      await seedNetwork('net-a');
      await seedFacility('fac-a');

      const { errors, didntSendReason } = await doImport({
        sheets: { Facilities: facilitySheet([['fac-a', 'fac-a', 'fac-a', 'net-a']]) },
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
      await seedNetwork('net-a');
      await seedFacility('fac-a', 'net-a');

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
      expect(facility.sensitiveNetworkId).toBe('net-a');
      expect(facility.name).toBe('Renamed facility');
    });

    it('keeps membership when the network cell is blank', async () => {
      await seedNetwork('net-a');
      await seedFacility('fac-a', 'net-a');

      const { errors } = await doImport({
        sheets: { Facilities: facilitySheet([['fac-a', 'fac-a', 'fac-a', null]]) },
      });

      expect(errors).toEqual([]);
      const facility = await models.Facility.findByPk('fac-a');
      expect(facility.sensitiveNetworkId).toBe('net-a');
    });

    it('keeps membership when the network cell is an empty string', async () => {
      await seedNetwork('net-a');
      await seedFacility('fac-a', 'net-a');

      const { errors } = await doImport({
        sheets: { Facilities: facilitySheet([['fac-a', 'fac-a', 'fac-a', '']]) },
      });

      expect(errors).toEqual([]);
      const facility = await models.Facility.findByPk('fac-a');
      expect(facility.sensitiveNetworkId).toBe('net-a');
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
      await seedNetwork('net-a');
      await seedFacility('fac-a', 'net-a');

      const { errors } = await doImport({
        sheets: { Facilities: facilitySheet([['fac-a', 'fac-a', 'fac-a', 'net-a']]) },
      });

      expect(errors).toEqual([]);
      const facility = await models.Facility.findByPk('fac-a');
      expect(facility.sensitiveNetworkId).toBe('net-a');
    });

    it('accepts the same file imported twice', async () => {
      const sheets = {
        'Sensitive Networks': networkSheet([['net-a', 'NETA', 'Network A']]),
        Facilities: facilitySheet([['fac-a', 'FACA', 'Facility A', 'net-a']]),
      };

      expect((await doImport({ sheets })).errors).toEqual([]);
      expect((await doImport({ sheets })).errors).toEqual([]);

      const facility = await models.Facility.findByPk('fac-a');
      expect(facility.sensitiveNetworkId).toBe('net-a');
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
