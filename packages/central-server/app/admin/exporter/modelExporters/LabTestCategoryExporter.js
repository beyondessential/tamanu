import { REFERENCE_DATA_RELATION_TYPES } from '@tamanu/constants';
import { ReferenceDataExporter } from './ReferenceDataExporter';

export class LabTestCategoryExporter extends ReferenceDataExporter {
  async getData() {
    const categories = await this.models.ReferenceData.findAll({
      where: {
        type: this.dataType,
        systemRequired: false,
      },
    });

    const defaults = await this.models.ReferenceDataRelation.getSingleChildByParentIds(
      categories.map(({ id }) => id),
      REFERENCE_DATA_RELATION_TYPES.DEFAULT_SPECIMEN_TYPE,
    );

    return categories.map(category => ({
      ...category.dataValues,
      defaultSpecimenType: defaults.get(category.id)?.id ?? '',
    }));
  }
}
