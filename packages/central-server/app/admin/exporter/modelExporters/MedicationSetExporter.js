import { REFERENCE_TYPES } from '@tamanu/constants';
import { DefaultDataExporter } from './DefaultDataExporter';
import { Op } from 'sequelize';

export class MedicationSetExporter extends DefaultDataExporter {
  async getData() {
    const medicationSets = await this.models.ReferenceData.findAll({
      where: {
        type: REFERENCE_TYPES.MEDICATION_SET,
      },
    });

    const medicationTemplates = await this.models.ReferenceDataRelation.findAll({
      attributes: ['referenceDataId', 'referenceDataParentId'],
      where: {
        referenceDataParentId: { [Op.in]: medicationSets.map(({ id }) => id) },
      },
    });

    return medicationSets.map((medicationSet) => ({
      ...medicationSet.dataValues,
      medicationTemplates: medicationTemplates
        .filter(({ referenceDataParentId }) => referenceDataParentId === medicationSet.id)
        .map(({ referenceDataId }) => referenceDataId)
        .join(','),
    }));
  }
}
