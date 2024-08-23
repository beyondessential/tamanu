import { ModelExporter } from './ModelExporter';

export class UserExporter extends ModelExporter {
  async getData() {
    const modelName = 'User';
    const data = await this.models[modelName].findAll({
      include: this.models.User.getFullReferenceAssociations(),
    });

    return data;
  }

  formatedCell(header, value) {
    if (header === 'designations') {
      return value.map(it => it.referenceData.id).join(', ');
    }
    return super.formatedCell(header, value);
  }
}
