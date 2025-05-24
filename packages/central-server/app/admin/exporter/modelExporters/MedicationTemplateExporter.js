import { ReferenceDataExporter } from './ReferenceDataExporter';

export class MedicationTemplateExporter extends ReferenceDataExporter {
  async getData() {
    const objects = await this.models.MedicationTemplate.findAll({
      include: ['referenceData'],
    });

    return objects.map((object) => {
      const { durationValue, durationUnit, referenceDataId, ...otherDataValues } = object.dataValues;
      return {
        ...otherDataValues,
        id: referenceDataId,
        duration: `${durationValue} ${durationUnit}`,
        code: object.referenceData?.code,
        name: object.referenceData?.name,
        visibilityStatus: object.referenceData?.visibilityStatus,
      };
    });
  }

  customHiddenColumns() {
    return ['type', 'referenceData'];
  }
}
