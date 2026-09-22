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

  // Back to before the networks existed, with one sensitive facility waiting, so the upgrade has
  // real work to do and both boundaries are live.
  const upgradeFromPreNetworkSchema = async () => {
    await umzug.down({ to: '1789695736424-createSensitiveNetworks.ts' });
    expect(await columnExists('is_sensitive')).toBe(true);
    expect(await columnExists('sensitive_network_id')).toBe(false);

    await database.sequelize.query(
      `INSERT INTO facilities (id, code, name, is_sensitive)
       VALUES ('facility-confidential', 'CONF', 'Confidential Clinic', TRUE);`,
    );

    await upgrade({
      sequelize: database.sequelize,
      models: database.models,
      toVersion: '0.0.0',
      serverType: 'central',
    });
  };

  // Run before createSensitiveNetworks and the step has nowhere to write: the insert fails on a
  // table that does not exist yet, taking the upgrade with it.
  it('runs after sensitive_networks is created', async () => {
    await upgradeFromPreNetworkSchema();

    const [[network]] = await database.sequelize.query(
      `SELECT code, name FROM sensitive_networks WHERE id = 'sensitiveNetwork-CONF';`,
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
    expect(facility.sensitive_network_id).toBe('sensitiveNetwork-CONF');
  });
});
