import { createTestContext } from '../utilities';

function getPermissionObject(models, roles) {
  const permissions = `
    SELECT * 
      FROM permissions
      WHERE permissions.role_id IN ?
  `;
  const getPermissionObject = [];
  permissions.forEach(p => {
    const ids = {};
  });
  const role = await models.Role.findByPk(roleName);
  const permissions = 
}

describe('Permissions', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });

  describe('creating permission definition from database', () => {
    it('should read a permission definition object from a series of records', async () => {
      
    });
  });

});
