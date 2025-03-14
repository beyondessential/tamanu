import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { getEndDate } from '@tamanu/shared/utils/medication';
import { addDays, endOfDay } from 'date-fns';
import { Model } from './Model';
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import type { Prescription } from './Prescription';

export class MedicationAdministrationRecord extends Model {
  declare id: string;
  declare status: string;
  declare administeredAt: string;
  declare doseAmount?: number;
  declare prescriptionId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        status: DataTypes.STRING,
        administeredAt: dateTimeType('administeredAt', {
          allowNull: false,
        }),
        doseAmount: DataTypes.DECIMAL,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static async generateMedicationAdministrationRecords(prescription: Prescription) {
    const { startDate, durationValue, durationUnit } = prescription;
    let endDate = getEndDate(startDate, durationValue, durationUnit);

    const twoDaysLater = endOfDay(addDays(new Date(), 2));
    let lastStartDate = new Date(startDate);

    // Set end date to 2 days later if endDate is greater than 2 days later
    if (endDate > twoDaysLater) {
      endDate = twoDaysLater;
    }

    const lastMedicationAdministrationRecord = await this.findOne({
      where: {
        prescriptionId: prescription.id,
      },
      order: [['administeredAt', 'DESC']],
    });
    // Set start date to last scheduled prescription date if it exists
    if (lastMedicationAdministrationRecord) {
      lastStartDate = new Date(lastMedicationAdministrationRecord.administeredAt);
    }
    while (lastStartDate < endDate) {
      for (const idealTime of prescription.idealTimes) {
        const [hours, minutes] = idealTime.split(':').map(Number);
        const administrationDate = new Date(
          lastStartDate.getFullYear(),
          lastStartDate.getMonth(),
          lastStartDate.getDate(),
          hours,
          minutes,
        );
        // Skip if administration date is before start date or after end date
        if (administrationDate < new Date(startDate) || administrationDate >= endDate) {
          continue;
        }
        await this.create({
          prescriptionId: prescription.id,
          administeredAt: administrationDate,
          doseAmount: prescription.doseAmount,
        });
      }
      lastStartDate = addDays(lastStartDate, 1);
    }
  }

  static getListReferenceAssociations() {
    return ['prescription'];
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Prescription, {
      foreignKey: 'prescriptionId',
      as: 'prescription',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
