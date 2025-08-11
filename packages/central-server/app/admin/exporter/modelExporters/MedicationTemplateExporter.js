import { ReferenceDataExporter } from './ReferenceDataExporter';

export class MedicationTemplateExporter extends ReferenceDataExporter {
  async getData() {
    const objects = await this.models.ReferenceMedicationTemplate.findAll({
      include: ['referenceData'],
    });

    return objects.map(object => {
      const {
        medicationId,
        durationValue,
        isPrn,
        isVariableDose,
        doseAmount,
        durationUnit,
        referenceDataId,
        isOngoing,
        ...otherDataValues
      } = object.dataValues;
      return {
        ...otherDataValues,
        id: referenceDataId,
        code: object.referenceData?.code,
        name: object.referenceData?.name,
        visibilityStatus: object.referenceData?.visibilityStatus,
        medication: medicationId,
        prnMedication: isPrn,
        doseAmount: isVariableDose ? 'variable' : doseAmount,
        duration: durationValue ? `${durationValue} ${durationUnit}` : null,
        ongoingMedication: isOngoing,
      };
    });
  }

  customHiddenColumns() {
    return ['type', 'referenceData'];
  }
}
