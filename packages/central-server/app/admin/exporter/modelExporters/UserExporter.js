import { ModelExporter } from './ModelExporter';

export class UserExporter extends ModelExporter {
  async getData() {
    const modelName = 'User';
    const users = await this.models[modelName].findAll({
      include: this.models.User.getFullReferenceAssociations(),
    });

    return users.map((user) => ({
      ...user.dataValues,
      designations: user.designations.map((it) => it.referenceData.id).join(', '),
      allowedFacilities: user.facilities.map(({ id }) => id).join(','),
    }));
  }

  customHiddenColumns() {
    return ['type', 'facilities'];
  }
}
