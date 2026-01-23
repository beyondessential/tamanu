import { DRUG_STOCK_STATUSES, REFERENCE_TYPES } from '@tamanu/constants';
import { ReferenceDataExporter } from './ReferenceDataExporter';

export class DrugExporter extends ReferenceDataExporter {
  async getData() {
    const drugs = await this.models.ReferenceData.findAll({
      where: {
        type: REFERENCE_TYPES.DRUG,
      },
      include: [
        {
          model: this.models.ReferenceDrug,
          as: 'referenceDrug',
          include: [
            {
              model: this.models.ReferenceDrugFacility,
              as: 'facilities',
            },
          ],
        },
      ],
    });

    const allFacilityIds = Array.from(
      new Set(drugs.flatMap((drug) => (drug.referenceDrug?.facilities ?? []).map((facility) => facility.facilityId)).filter(Boolean))
    ).sort();

    return drugs.map((drug) => {
      const baseData = {
        ...drug.dataValues,
        route: drug.referenceDrug?.route,
        units: drug.referenceDrug?.units,
        notes: drug.referenceDrug?.notes,
        isSensitive: drug.referenceDrug?.isSensitive,
      };

      for (const facilityId of allFacilityIds) {
        baseData[facilityId] = DRUG_STOCK_STATUSES.UNKNOWN;
      }

      if (drug.referenceDrug?.facilities) {
        drug.referenceDrug.facilities.forEach((facility) => {
          baseData[facility.facilityId] = facility.quantity ?? facility.stockStatus;
        });
      }

      return baseData;
    });
  }

  customHiddenColumns() {
    return ['type', 'referenceDrug'];
  }
}
