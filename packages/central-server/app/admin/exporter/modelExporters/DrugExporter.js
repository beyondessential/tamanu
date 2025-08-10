import { REFERENCE_TYPES } from '@tamanu/constants';
import { ReferenceDataExporter } from './ReferenceDataExporter';

export class DrugExporter extends ReferenceDataExporter {
  async getData() {
    const drugs = await this.models.ReferenceData.findAll({
      where: {
        type: REFERENCE_TYPES.DRUG,
      },
      include: {
        model: this.models.ReferenceDrug,
        as: 'referenceDrug',
      },
    });

    return drugs.map((drug) => ({
      ...drug.dataValues,
      route: drug.referenceDrug?.route,
      units: drug.referenceDrug?.units,
      notes: drug.referenceDrug?.notes,
      isSensitive: drug.referenceDrug?.isSensitive,
    }));
  }

  customHiddenColumns() {
    return ['type', 'referenceDrug'];
  }
}
