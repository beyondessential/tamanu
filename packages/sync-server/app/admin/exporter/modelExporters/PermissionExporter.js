import { DELETION_STATUSES } from '@tamanu/constants';
import { ModelExporter } from './ModelExporter';

const mapDeletionStatus = deletionStatus => {
  switch (deletionStatus) {
    case DELETION_STATUSES.CURRENT:
      return 'y';
    case DELETION_STATUSES.REVOKED:
      return 'n';
    default:
      return 'y';
  }
};

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
        data[key][permission.roleId] = mapDeletionStatus(permission.deletionStatus);
      } else {
        data[key] = {
          verb: permission.verb,
          noun: permission.noun,
          objectId: permission.objectId,
          ...roles,
          [permission.roleId]: mapDeletionStatus(permission.deletionStatus),
        };
      }
    });

    return Object.values(data);
  }

  getHeadersFromData(data) {
    return Object.keys(data[0]);
  }
}
