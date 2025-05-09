import { REFERENCE_TYPES } from '@tamanu/constants';
import { ReferenceDataExporter } from './ReferenceDataExporter';

export class MedicationTemplateExporter extends ReferenceDataExporter {
  async getData() {
    const objects = await this.models.ReferenceData.findAll({
      where: {
        type: REFERENCE_TYPES.MEDICATION_TEMPLATE,
      },
      include: {
        model: this.models.MedicationTemplate,
        as: 'medicationTemplate',
      },
    });

    return objects.map((object) => ({
      ...object.dataValues,
      medication: object.medicationTemplate?.medicationId,
      prnMedication: object.medicationTemplate?.isPrn.toString().toUpperCase(),
      doseAmount: object.medicationTemplate?.doseAmount,
      units: object.medicationTemplate?.units,
      frequency: object.medicationTemplate?.frequency,
      route: object.medicationTemplate?.route,
      duration: `${object.medicationTemplate?.durationValue} ${object.medicationTemplate?.durationUnit}`,
      notes: object.medicationTemplate?.notes,
      dischargeQuantity: object.medicationTemplate?.dischargeQuantity,
      visibilityStatus: object.medicationTemplate?.visibilityStatus,
    }));
  }

  customHiddenColumns() {
    return ['type', 'medicationTemplate'];
  }
}
