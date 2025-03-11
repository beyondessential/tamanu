import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import { buildEncounterLinkedLookupFilter, buildEncounterLinkedSyncFilter } from '../sync';
import type { Prescription } from './Prescription';
import { getEndDate } from '@tamanu/shared/utils/medication';
import { addDays, endOfDay } from 'date-fns';

export class ScheduledPrescription extends Model {
  declare id: string;
  declare status: string;
  declare administeredAt: string;
  declare doseAmount?: number;
  declare isAlert?: boolean;
  declare isEdited?: boolean;
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
        isAlert: DataTypes.BOOLEAN,
        isEdited: DataTypes.BOOLEAN,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static async generateScheduledPrescriptions(prescription: Prescription) {
    const { startDate, durationValue, durationUnit } = prescription;
    let endDate = getEndDate(startDate, durationValue, durationUnit);
  
    const twoDaysLater = endOfDay(addDays(new Date(), 2));
    let lastStartDate = new Date(startDate);

    // Set end date to 2 days later if endDate is greater than 2 days later
    if (endDate > twoDaysLater) {
      endDate = twoDaysLater;
    }

    const lastScheduledPrescription = await this.findOne({
      where: {
        prescriptionId: prescription.id,
      },
      order: [['administeredAt', 'DESC']],
    });
    console.log(lastScheduledPrescription);
    // Set start date to last scheduled prescription date if it exists
    if (lastScheduledPrescription) {
      lastStartDate = new Date(lastScheduledPrescription.administeredAt);
    }
    console.log(lastStartDate);
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
        const scheduledPrescription = await this.create({
          prescriptionId: prescription.id,
          administeredAt: administrationDate,
          doseAmount: prescription.doseAmount,
        });
        console.log(scheduledPrescription);
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

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static buildSyncLookupQueryDetails() {
    return buildEncounterLinkedLookupFilter(this);
  }
}
