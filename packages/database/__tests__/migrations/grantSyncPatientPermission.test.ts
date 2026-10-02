import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { closeDatabase, createTestDatabase } from '../utilities';
import {
  down,
  up,
} from '../../src/migrations/1790808087263-grantSyncPatientPermissionToPatientReaders';

describe('grantSyncPatientPermissionToPatientReaders migration', () => {
  let models;
  let sequelize;

  beforeAll(async () => {
    ({ models, sequelize } = await createTestDatabase());
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await models.Permission.destroy({ where: {}, force: true });
    await models.Role.destroy({ where: {}, force: true });
  });

  const createRoleWithPermissions = async (roleId, permissions) => {
    await models.Role.create({ id: roleId, name: roleId });
    for (const [verb, noun] of permissions) {
      await models.Permission.create({
        id: models.Permission.generatePermissionId(roleId, verb, noun),
        roleId,
        verb,
        noun,
      });
    }
  };

  const syncPatientGrants = () =>
    models.Permission.findAll({
      where: { noun: 'SyncPatient', verb: 'create' },
      order: [['roleId', 'ASC']],
    });

  const runUp = () => up(sequelize.getQueryInterface());

  it('grants create SyncPatient to roles that can read patients', async () => {
    await createRoleWithPermissions('Clinician', [['read', 'Patient']]);
    await createRoleWithPermissions('Reception', [['list', 'User']]);

    await runUp();

    const grants = await syncPatientGrants();
    expect(grants.map(g => g.roleId)).toEqual(['Clinician']);
    expect(grants[0].id).toBe(
      models.Permission.generatePermissionId('Clinician', 'create', 'SyncPatient'),
    );
    expect(grants[0].objectId).toBeNull();
  });

  it('skips roles whose read Patient grant has been revoked', async () => {
    await createRoleWithPermissions('Clinician', [['read', 'Patient']]);
    await models.Permission.destroy({ where: { roleId: 'Clinician' } });

    await runUp();

    expect(await syncPatientGrants()).toHaveLength(0);
  });

  it('leaves an existing grant in place without duplicating it', async () => {
    await createRoleWithPermissions('Clinician', [
      ['read', 'Patient'],
      ['create', 'SyncPatient'],
    ]);

    await runUp();
    await runUp();

    expect(await syncPatientGrants()).toHaveLength(1);
  });

  it('removes the grants on down', async () => {
    await createRoleWithPermissions('Clinician', [['read', 'Patient']]);
    await runUp();

    await down(sequelize.getQueryInterface());

    expect(await syncPatientGrants()).toHaveLength(0);
    expect(await models.Permission.count({ where: { roleId: 'Clinician', noun: 'Patient' } })).toBe(
      1,
    );
  });
});
