import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { closeDatabase, createTestDatabase } from '../utilities';
import {
  down,
  up,
} from '../../src/migrations/1792372211442-grantMedicationDueTaskPermissionToMarListers';

describe('grantMedicationDueTaskPermissionToMarListers migration', () => {
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

  const medicationDueTaskGrants = () =>
    models.Permission.findAll({
      where: { noun: 'MedicationDueTask', verb: 'read' },
      order: [['roleId', 'ASC']],
    });

  const runUp = () => up(sequelize.getQueryInterface());

  it('grants read MedicationDueTask to roles that can list medication administrations', async () => {
    await createRoleWithPermissions('Nurse', [['list', 'MedicationAdministration']]);
    await createRoleWithPermissions('Physio', [['read', 'MedicationAdministration']]);

    await runUp();

    const grants = await medicationDueTaskGrants();
    expect(grants.map(g => g.roleId)).toEqual(['Nurse']);
    expect(grants[0].id).toBe(
      models.Permission.generatePermissionId('Nurse', 'read', 'MedicationDueTask'),
    );
    expect(grants[0].objectId).toBeNull();
  });

  it('skips roles whose list MedicationAdministration grant has been revoked', async () => {
    await createRoleWithPermissions('Nurse', [['list', 'MedicationAdministration']]);
    await models.Permission.destroy({ where: { roleId: 'Nurse' } });

    await runUp();

    expect(await medicationDueTaskGrants()).toHaveLength(0);
  });

  it('leaves an existing grant in place without duplicating it', async () => {
    await createRoleWithPermissions('Nurse', [
      ['list', 'MedicationAdministration'],
      ['read', 'MedicationDueTask'],
    ]);

    await runUp();
    await runUp();

    expect(await medicationDueTaskGrants()).toHaveLength(1);
  });

  it('removes the grants on down', async () => {
    await createRoleWithPermissions('Nurse', [['list', 'MedicationAdministration']]);
    await runUp();

    await down(sequelize.getQueryInterface());

    expect(await medicationDueTaskGrants()).toHaveLength(0);
    expect(
      await models.Permission.count({
        where: { roleId: 'Nurse', noun: 'MedicationAdministration' },
      }),
    ).toBe(1);
  });
});
