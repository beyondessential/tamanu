import { ReferenceDataExporter } from './ReferenceDataExporter';

export class MedicationTemplateExporter extends ReferenceDataExporter {
  async getData() {
    const objects = await this.models.ReferenceMedicationTemplate.findAll({
      include: ['referenceData'],
    });

    return objects.map((object) => {
      const {
        medicationId,
        durationValue,
        isPrn,
        isVariableDose,
        doseAmount,
        durationUnit,
        referenceDataId,
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
        duration: `${durationValue} ${durationUnit}`,
      };
    });
  }

  customHiddenColumns() {
    return ['type', 'referenceData'];
  }
}
