import { USER_KINDS } from '@tamanu/constants';
import { ModelExporter } from './ModelExporter';

export class UserExporter extends ModelExporter {
  async getData() {
    const modelName = 'User';
    const users = await this.models[modelName].findAll({
      // Only human users are exported; machine accounts (sync, system) opt out by kind
      where: { kind: USER_KINDS.USER },
      include: this.models.User.getFullReferenceAssociations(),
    });

    return users.map(user => ({
      ...user.dataValues,
      designations: user.designations.map(it => it.referenceData.id).join(', '),
      allowedFacilities: user.facilities.map(({ id }) => id).join(','),
    }));
  }

  customHiddenColumns() {
    return ['type', 'facilities', 'kind'];
  }
}
