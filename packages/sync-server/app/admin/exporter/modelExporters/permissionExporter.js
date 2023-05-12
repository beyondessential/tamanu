import { ModelExporter } from './modelExporter';

export class PermissionExporter extends ModelExporter {
  async getData() {
    const permissions = await this.models.Permission.findAll();
    const roles = permissions.reduce((acc, { dataValues: permission }) => {
      const { roleId } = permission;
      if (!acc[roleId]) {
        acc[roleId] = '';
      }
      return acc;
    }, {});

    const data = [];
    permissions.forEach(permissionModel => {
      const permission = permissionModel.dataValues;
      const addedRow = data.find(p => p.verb === permission.verb && p.noun === permission.noun);
      if (addedRow) {
        addedRow[permission.roleId] = permission.deletedAt ? 'n' : 'y';
      } else {
        data.push({
          verb: permission.verb,
          noun: permission.noun,
          objectId: permission.objectId,
          ...roles,
          [permission.roleId]: permission.deletedAt ? 'n' : 'y',
        });
      }
    });

    return data;
  }

  getHeadersFromData(data) {
    return Object.keys(data[0]);
  }
}
