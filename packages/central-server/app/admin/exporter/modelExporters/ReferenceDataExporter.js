import { ModelExporter } from './ModelExporter';

export class ReferenceDataExporter extends ModelExporter {
  async getData() {
    const data = await this.models.ReferenceData.findAll({
      where: {
        type: this.dataType,
      },
    });

    return data;
  }

  customHiddenColumns() {
    return ['type'];
  }
}
