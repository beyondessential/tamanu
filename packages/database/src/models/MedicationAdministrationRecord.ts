import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { addDays, addHours, endOfDay, startOfDay } from 'date-fns';
import config from 'config';
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
    const upcomingRecordsShouldBeGeneratedTimeFrame =
      config?.medicationAdministrationRecord?.upcomingRecordsShouldBeGeneratedTimeFrame || 72;
    const upcomingRecordsTimeFrame =
      config?.medicationAdministrationRecord?.upcomingRecordsTimeFrame || 48;

    const upcomingEndDate = endOfDay(
      addHours(
        new Date(),
        prescription.endDate ? upcomingRecordsShouldBeGeneratedTimeFrame : upcomingRecordsTimeFrame,
      ),
    );

    // Set default end date
    let endDate = upcomingEndDate;

    // Override with prescription end date if it's earlier
    if (prescription.endDate && new Date(prescription.endDate) < upcomingEndDate) {
      endDate = new Date(prescription.endDate);
    }

    let lastStartDate = new Date(prescription.startDate);

    // Set end date to upcoming end date if it is before the calculated end date
    if (endDate > upcomingEndDate) {
      endDate = upcomingEndDate;
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
        if (
          administrationDate < new Date(prescription.startDate) ||
          administrationDate >= endDate
        ) {
          continue;
        }
        await this.create({
          prescriptionId: prescription.id,
          administeredAt: administrationDate,
          doseAmount: prescription.doseAmount,
        });
      }
      lastStartDate = startOfDay(addDays(lastStartDate, 1));
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
