import { ModelExporter } from './ModelExporter';

const CUSTOM_DATA_TYPE_NAMES = {
  diagnosis: 'icd10',
};

export class ReferenceDataExporter extends ModelExporter {
  async getData() {
    const type = CUSTOM_DATA_TYPE_NAMES[this.dataType] || this.dataType;
    const data = await this.models.ReferenceData.findAll({
      where: {
        type,
      },
    });

    return data;
  }

  customHiddenColumns() {
    return ['type'];
  }
}
