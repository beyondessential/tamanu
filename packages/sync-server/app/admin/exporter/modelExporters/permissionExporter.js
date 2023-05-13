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

    const data = {};
    permissions.forEach(({ dataValues: permission }) => {
      const key = `${permission.verb}#${permission.noun}`;
      if (data[key]) {
        data[key][permission.roleId] = permission.deletedAt ? 'n' : 'y';
      } else {
        data[key] = {
          verb: permission.verb,
          noun: permission.noun,
          objectId: permission.objectId,
          ...roles,
          [permission.roleId]: permission.deletedAt ? 'n' : 'y',
        };
      }
    });

    return Object.values(data);
  }

  getHeadersFromData(data) {
    return Object.keys(data[0]);
  }
}
