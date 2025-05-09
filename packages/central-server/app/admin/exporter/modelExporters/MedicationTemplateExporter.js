import { ReferenceDataExporter } from './ReferenceDataExporter';

export class MedicationTemplateExporter extends ReferenceDataExporter {
  async getData() {
    const objects = await this.models.MedicationTemplate.findAll({
      include: ['referenceData'],
    });

    return objects.map((object) => {
      const { durationValue, durationUnit, ...otherDataValues } = object.dataValues;
      return {
        ...otherDataValues,
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
