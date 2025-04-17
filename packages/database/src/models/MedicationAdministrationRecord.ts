import { DataTypes, Op, type Transaction } from 'sequelize';
import { ADMINISTRATION_FREQUENCIES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { addDays, addHours, endOfDay, isValid, startOfDay } from 'date-fns';
import config from 'config';
import { Model } from './Model';
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import type { Prescription } from './Prescription';
import type { Encounter } from './Encounter';

export class MedicationAdministrationRecord extends Model {
  declare id: string;
  declare status?: string;
  declare dueAt: string;
  declare recordedAt?: string;
  declare prescriptionId?: string;
  declare reasonNotGivenId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        status: DataTypes.STRING,
        dueAt: dateTimeType('dueAt', {
          allowNull: false,
        }),
        recordedAt: dateTimeType('recordedAt', {
          allowNull: true,
        }),
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static async generateMedicationAdministrationRecords(prescription: Prescription) {
    if (!prescription.frequency || !prescription.startDate) {
      return;
    }

    const lastMedicationAdministrationRecord = await this.findOne({
      where: {
        prescriptionId: prescription.id,
      },
      order: [['dueAt', 'DESC']],
    });

    if (
      prescription.frequency === ADMINISTRATION_FREQUENCIES.IMMEDIATELY ||
      prescription.frequency === ADMINISTRATION_FREQUENCIES.AS_DIRECTED
    ) {
      if (!lastMedicationAdministrationRecord) {
        await this.create({
          prescriptionId: prescription.id,
          dueAt: prescription.startDate,
        });
      }
      return;
    }

    const upcomingRecordsShouldBeGeneratedTimeFrame =
      config?.medicationAdministrationRecord?.upcomingRecordsShouldBeGeneratedTimeFrame || 72;

    let endDate = endOfDay(addHours(new Date(), upcomingRecordsShouldBeGeneratedTimeFrame));

    // Override with prescription end date if it's earlier
    if (prescription.endDate && new Date(prescription.endDate) < endDate) {
      endDate = new Date(prescription.endDate);
    }

    let lastDueDate = new Date(lastMedicationAdministrationRecord?.dueAt || prescription.startDate);

    while (lastDueDate < endDate) {
      for (const idealTime of prescription.idealTimes || []) {
        const [hours, minutes] = idealTime.split(':').map(Number);
        const nextDueDate = new Date(
          lastDueDate.getFullYear(),
          lastDueDate.getMonth(),
          lastDueDate.getDate(),
          hours,
          minutes,
          0,
        );
        // Skip if administration date is before start date or after end date
        if (
          nextDueDate < new Date(prescription.startDate) ||
          nextDueDate > endDate ||
          nextDueDate <= lastDueDate ||
          (prescription.discontinuedDate && nextDueDate >= new Date(prescription.discontinuedDate))
        ) {
          continue;
        }
        // Skip if administration date is not valid (required to pass unit tests)
        if (isValid(nextDueDate)) {
          await this.create({
            prescriptionId: prescription.id,
            dueAt: nextDueDate,
          });
        }
      }
      // Get next administration date based on frequency
      switch (prescription.frequency) {
        case ADMINISTRATION_FREQUENCIES.EVERY_SECOND_DAY:
          lastDueDate = startOfDay(addDays(lastDueDate, 2));
          break;
        case ADMINISTRATION_FREQUENCIES.ONCE_A_WEEK:
          lastDueDate = startOfDay(addDays(lastDueDate, 7));
          break;
        case ADMINISTRATION_FREQUENCIES.ONCE_A_MONTH: {
          // Get the day of the month from the last administration date
          const dayOfMonth = lastDueDate.getDate();

          // Create next month's date
          const nextMonthDate = new Date(lastDueDate);
          nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

          // If the day is 29th, 30th, or 31st, set to 1st of next month
          if (dayOfMonth >= 29) {
            nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
            nextMonthDate.setDate(1);
          } else {
            // Keep the same day of month
            nextMonthDate.setDate(dayOfMonth);
          }

          lastDueDate = startOfDay(nextMonthDate);
          break;
        }
        default:
          lastDueDate = startOfDay(addDays(lastDueDate, 1));
          break;
      }
    }
  }

  static async onEncounterDischarged(encounter: Encounter, transaction?: Transaction) {
    const { models } = this.sequelize;
    const encounterId = encounter.id;

    const encounterPrescriptions = await models.EncounterPrescription.findAll({
      where: {
        encounterId,
      },
      attributes: ['prescriptionId'],
      transaction,
    });

    await models.MedicationAdministrationRecord.destroy({
      where: {
        dueAt: {
          [Op.gt]: encounter.endDate,
        },
        prescriptionId: {
          [Op.in]: encounterPrescriptions.map(
            (encounterPrescription) => encounterPrescription.prescriptionId,
          ),
        },
        status: null,
      },
      transaction,
    });
  }

  static async onPrescriptionDiscontinued(
    prescription: Prescription,
    transaction?: Transaction | null,
  ) {
    const { models } = this.sequelize;

    await models.MedicationAdministrationRecord.destroy({
      where: {
        prescriptionId: prescription.id,
        dueAt: {
          [Op.gt]: prescription.discontinuedDate,
        },
        status: null,
      },
      transaction,
    });
  }

  static getListReferenceAssociations() {
    return ['prescription'];
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Prescription, {
      foreignKey: 'prescriptionId',
      as: 'prescription',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'reasonNotGivenId',
      as: 'reasonNotGiven',
    });
    this.hasMany(models.MedicationAdministrationRecordDose, {
      foreignKey: 'medicationAdministrationRecordId',
      as: 'doses',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
