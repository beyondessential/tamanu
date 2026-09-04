import { Op } from 'sequelize';
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

    const defaults = await this.models.ReferenceDataRelation.findAll({
      attributes: ['referenceDataId', 'referenceDataParentId'],
      where: {
        type: REFERENCE_DATA_RELATION_TYPES.DEFAULT_SPECIMEN_TYPE,
        referenceDataParentId: { [Op.in]: categories.map(({ id }) => id) },
      },
    });

    return categories.map(category => ({
      ...category.dataValues,
      defaultSpecimenType:
        defaults.find(({ referenceDataParentId }) => referenceDataParentId === category.id)
          ?.referenceDataId ?? '',
    }));
  }
}
