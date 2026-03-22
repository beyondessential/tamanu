import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { DataTypes, Op } from 'sequelize';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
} from '../sync/buildEncounterLinkedLookupFilter';

export class EncounterPausePrescription extends Model {
  declare id: string;
  declare encounterPrescriptionId?: string; // Reference to EncounterPrescription
  declare pauseDuration: number; // Duration of the pause
  declare pauseTimeUnit: string; // 'Hours' or 'Days'
  declare pauseStartDate: string; // When the pause started
  declare pauseEndDate: string; // When the pause will end (updated to current time if manually resumed)
  declare notes?: string; // Optional notes
  declare pausingClinicianId?: string; // Who paused the prescription
  declare createdBy?: string; // User who created the record
  declare updatedBy?: string; // User who last updated the record

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        pauseDuration: {
          type: DataTypes.DECIMAL,
          allowNull: false,
        },
        pauseTimeUnit: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        pauseStartDate: dateTimeType('pauseStartDate', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
        pauseEndDate: dateTimeType('pauseEndDate', {
          allowNull: false,
        }),
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        ...options,
        tableName: 'encounter_pause_prescriptions',
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        hooks: {
          // Create history records
          afterCreate: async (instance: EncounterPausePrescription, options) => {
            // Get the EncounterPausePrescriptionHistory model
            const historyModel = instance.sequelize.models.EncounterPausePrescriptionHistory;
            if (!historyModel) return;

            // Create a history record for the pause action
            await historyModel.create(
              {
                encounterPrescriptionId: instance.encounterPrescriptionId,
                action: 'pause',
                actionDate: instance.pauseStartDate,
                actionUserId: instance.pausingClinicianId, // Use pausingClinicianId for the action user
                notes: instance.notes,
                pauseDuration: instance.pauseDuration,
                pauseTimeUnit: instance.pauseTimeUnit,
              },
              {
                transaction: options.transaction,
              },
            );
          },

          afterUpdate: async (instance: EncounterPausePrescription, options) => {
            const historyModel = instance.sequelize.models.EncounterPausePrescriptionHistory;
            if (!historyModel) return;

            const currentDate = getCurrentDateTimeString();

            // Check if this is a manual resume (pauseEndDate was changed to be <= current date)
            if (
              instance.pauseEndDate &&
              new Date(instance.pauseEndDate).getTime() <= new Date(currentDate).getTime()
            ) {
              // Create a history record for the resume action
              await historyModel.create(
                {
                  encounterPrescriptionId: instance.encounterPrescriptionId,
                  action: 'resume',
                  actionDate: instance.pauseEndDate,
                  actionUserId: instance.updatedBy, // Use updatedBy which should be set by the controller
                  notes: instance.notes,
                },
                {
                  transaction: options.transaction,
                },
              );
            }
          },
        },
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.EncounterPrescription, {
      foreignKey: 'encounterPrescriptionId',
      as: 'encounterPrescription',
    });
    this.belongsTo(models.User, {
      foreignKey: 'pausingClinicianId',
      as: 'pausingClinician',
    });
    this.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'createdByUser',
    });
    this.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'updatedByUser',
    });
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'encounter_prescriptions', 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterLinkedLookupSelect(this),
      joins: buildEncounterLinkedLookupJoins(this, ['encounter_prescriptions', 'encounters']),
    };
  }

  /**
   * Check if a prescription is currently paused
   * @param {string} prescriptionId - The ID of the prescription to check
   * @returns {Promise<{isPaused: boolean, pauseData?: EncounterPausePrescription}>} Whether the medication is paused and the pause data if it is
   */
  static async isPrescriptionPaused(
    prescriptionId: string,
  ): Promise<{ isPaused: boolean; pauseData?: EncounterPausePrescription }> {
    try {
      // Get the models from sequelize
      const models = this.sequelize.models;
      const EncounterPrescription = models.EncounterPrescription;

      // Find the encounter prescription link (assuming 1:1 relationship)
      const encounterPrescription = await EncounterPrescription.findOne({
        where: {
          prescriptionId,
        },
      });

      if (!encounterPrescription) {
        return { isPaused: false };
      }

      // Check if there's an active pause record for this encounter-prescription
      const currentDate = getCurrentDateTimeString();
      const activePause = await this.findOne({
        where: {
          encounterPrescriptionId: encounterPrescription.id,
          pauseEndDate: {
            [Op.gt]: currentDate,
          },
        },
        order: [['createdAt', 'DESC']],
      });

      return {
        isPaused: !!activePause,
        pauseData: activePause || undefined,
      };
    } catch (error) {
      console.error('Error checking if prescription is paused:', error);
      return { isPaused: false };
    }
  }
}
