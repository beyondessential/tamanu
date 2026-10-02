import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { log } from '@tamanu/shared/services/logging/log';
import { upgrade } from '@tamanu/upgrade';

import { closeDatabase, initDatabase } from '../utilities';
import { createMigrationInterface } from '../../src/services/migrations/migrations';
import { runPostMigration, runPreMigration } from '../../src/services/migrations/hooks';

// The backfill reads facilities.is_sensitive, which dropFacilityIsSensitive removes in the same
// upgrade. Ordering is declared on the steps, but nothing proved the runner honours it against a
// real database — and the failure is silent: run it after the drop and the column is gone, run it
// before the networks exist and there is nowhere to put them. Either way a sensitive facility
// comes out of the upgrade with no network, which reads as not sensitive.
//
// So this drives the real upgrade from a pre-upgrade schema. The facility ending up in a network
// is only possible if the step ran inside that window.
// spec: specs/sync/sensitive-networks.md
describe('sensitive network upgrade ordering', () => {
  let database;
  let umzug;

  beforeEach(async () => {
    database = await initDatabase();
    ({ migrations: umzug } = await createMigrationInterface(log, database.sequelize));
    await runPreMigration(log, database.sequelize);
    await umzug.up();
    await runPostMigration(log, database.sequelize);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  const columnExists = async column => {
    const [[row]] = await database.sequelize.query(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_name = 'facilities' AND column_name = :column
       ) AS "exists";`,
      { replacements: { column } },
    );
    return row.exists;
  };

  // Back to before the networks existed, so both boundaries are live.
  const downToPreNetworkSchema = async () => {
    await umzug.down({ to: '1789695736424-createSensitiveNetworks.ts' });
    expect(await columnExists('is_sensitive')).toBe(true);
    expect(await columnExists('sensitive_network_id')).toBe(false);
  };

  const addFacility = (id: string, code: string, name: string, isSensitive = true) =>
    database.sequelize.query(
      `INSERT INTO facilities (id, code, name, is_sensitive) VALUES (:id, :code, :name, :isSensitive);`,
      { replacements: { id, code, name, isSensitive } },
    );

  const addSensitiveFacility = (id: string, code: string, name: string) =>
    addFacility(id, code, name);

  const runUpgrade = () =>
    upgrade({
      sequelize: database.sequelize,
      models: database.models,
      toVersion: '0.0.0',
      serverType: 'central',
    });

  // One sensitive facility waiting, so the ordinary backfill has real work to do.
  const upgradeFromPreNetworkSchema = async () => {
    await downToPreNetworkSchema();
    await addSensitiveFacility('facility-confidential', 'CONF', 'Confidential Clinic');
    await runUpgrade();
  };

  // Run before createSensitiveNetworks and the step has nowhere to write: the insert fails on a
  // table that does not exist yet, taking the upgrade with it.
  it('runs after sensitive_networks is created', async () => {
    await upgradeFromPreNetworkSchema();

    const [[network]] = await database.sequelize.query(
      `SELECT code, name FROM sensitive_networks WHERE id = 'sensitiveNetwork-facility-confidential';`,
    );
    expect(network).toMatchObject({ code: 'CONF', name: 'Confidential Clinic' });
  });

  // Run after dropFacilityIsSensitive and the step cannot tell which facilities were sensitive:
  // the column it reads is gone, so the facility comes out belonging to no network at all.
  it('runs before is_sensitive is dropped', async () => {
    await upgradeFromPreNetworkSchema();

    expect(await columnExists('is_sensitive')).toBe(false);
    const [[facility]] = await database.sequelize.query(
      `SELECT sensitive_network_id FROM facilities WHERE id = 'facility-confidential';`,
    );
    expect(facility.sensitive_network_id).toBe('sensitiveNetwork-facility-confidential');
  });

  // The Fiji path runs in the same window and is chosen from the deployment's data, but it is only
  // ever driven directly or with mocked gating — nothing else runs the real runner with the three
  // SRH facilities present, so nothing proves it is selected over the ordinary backfill.
  it('takes the Fiji path when the three SRH facilities are there, leaving the ordinary backfill nothing to do', async () => {
    await downToPreNetworkSchema();
    await addSensitiveFacility('facility-SRHCentral', 'SRHCentral', 'SRH Central');
    await addSensitiveFacility('facility-SRHWestern', 'SRHWestern', 'SRH Western');
    await addSensitiveFacility('facility-SRHNorthern', 'SRHNorthern', 'SRH Northern');

    await runUpgrade();

    // one shared network, not the network of one each the ordinary backfill would have built
    const [networks] = await database.sequelize.query(
      `SELECT id FROM sensitive_networks ORDER BY id;`,
    );
    expect(networks.map((network: any) => network.id)).toEqual(['sensitiveNetwork-srh']);

    const [members] = await database.sequelize.query(
      `SELECT id FROM facilities WHERE sensitive_network_id = 'sensitiveNetwork-srh' ORDER BY id;`,
    );
    expect(members.map((facility: any) => facility.id)).toEqual([
      'facility-SRHCentral',
      'facility-SRHNorthern',
      'facility-SRHWestern',
    ]);

    // the step reads is_sensitive to decide it is wanted, so it has to have run before this
    expect(await columnExists('is_sensitive')).toBe(false);
  });

  // The mirror of the case above, and the rule that decides between them: all three or none. Two of
  // them is not the deployment the Fiji step describes, so the ordinary backfill takes it and each
  // facility keeps its own network — isolation preserved rather than widened by accident.
  it('takes the ordinary path when only some of the SRH facilities are there', async () => {
    await downToPreNetworkSchema();
    await addSensitiveFacility('facility-SRHCentral', 'SRHCentral', 'SRH Central');
    await addSensitiveFacility('facility-SRHWestern', 'SRHWestern', 'SRH Western');

    await runUpgrade();

    const [networks] = await database.sequelize.query(
      `SELECT id FROM sensitive_networks ORDER BY id;`,
    );
    expect(networks.map((network: any) => network.id)).toEqual([
      'sensitiveNetwork-facility-SRHCentral',
      'sensitiveNetwork-facility-SRHWestern',
    ]);

    const [members] = await database.sequelize.query(
      `SELECT id, sensitive_network_id FROM facilities ORDER BY id;`,
    );
    expect(members).toEqual([
      { id: 'facility-SRHCentral', sensitive_network_id: 'sensitiveNetwork-facility-SRHCentral' },
      { id: 'facility-SRHWestern', sensitive_network_id: 'sensitiveNetwork-facility-SRHWestern' },
    ]);
  });

  // The common case: nearly every deployment upgrades with nothing sensitive at all, and should
  // come out of it with no networks rather than an empty one or a network per facility.
  it('creates no networks on a deployment with nothing sensitive', async () => {
    await downToPreNetworkSchema();
    await addFacility('facility-ordinary', 'ORD', 'Ordinary Clinic', false);

    await runUpgrade();

    const [networks] = await database.sequelize.query(`SELECT id FROM sensitive_networks;`);
    expect(networks).toEqual([]);

    const [[facility]] = await database.sequelize.query(
      `SELECT sensitive_network_id FROM facilities WHERE id = 'facility-ordinary';`,
    );
    expect(facility.sensitive_network_id).toBeNull();
  });

  // A network's code and name are unique and a facility's are not, so two sensitive facilities
  // sharing either would collide on the insert and take the whole upgrade down with them. CI caught
  // this on seeded data holding two facilities called the same thing.
  it('qualifies the network code and name where two sensitive facilities share one', async () => {
    await downToPreNetworkSchema();
    await addFacility('facility-dispensary-north', 'DISP-N', 'National Dispensary');
    await addFacility('facility-dispensary-south', 'DISP-S', 'National Dispensary');

    await runUpgrade();

    const [networks] = await database.sequelize.query(
      `SELECT id, code, name FROM sensitive_networks ORDER BY id;`,
    );
    expect(networks).toEqual([
      {
        id: 'sensitiveNetwork-facility-dispensary-north',
        code: 'DISP-N',
        name: 'National Dispensary 1',
      },
      {
        id: 'sensitiveNetwork-facility-dispensary-south',
        code: 'DISP-S',
        name: 'National Dispensary 2',
      },
    ]);
  });
});
