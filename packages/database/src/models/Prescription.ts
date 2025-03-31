import { DataTypes } from 'sequelize';
import { NOTIFICATION_TYPES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { Model } from './Model';
import { dateTimeType, type InitOptions, type Models } from '../types/model';

export class Prescription extends Model {
  declare id: string;
  declare isOngoing?: boolean;
  declare isPrn?: boolean;
  declare isVariableDose?: boolean;
  declare doseAmount: number;
  declare units: string;
  declare frequency: string;
  declare idealTimes: string[];
  declare route: string;
  declare date: string;
  declare startDate: string;
  declare endDate?: string;
  declare durationValue?: number;
  declare durationUnit?: string;
  declare indication?: string;
  declare isPhoneOrder?: boolean;
  declare notes?: string;
  declare pharmacyNotes?: string;
  declare displayPharmacyNotesInMar?: boolean;
  declare quantity?: number;
  declare discontinued?: boolean;
  declare discontinuedDate?: string;
  declare discontinuingReason?: string;
  declare repeats?: number;
  declare prescriberId?: string;
  declare discontinuingClinicianId?: string;
  declare medicationId?: string;

  static initModel({ primaryKey, ...options }: InitOptions, models: Models) {
    super.init(
      {
        id: primaryKey,
        isOngoing: DataTypes.BOOLEAN,
        isPrn: DataTypes.BOOLEAN,
        isVariableDose: DataTypes.BOOLEAN,
        doseAmount: DataTypes.DECIMAL,
        units: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        frequency: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        idealTimes: DataTypes.ARRAY(DataTypes.STRING),
        route: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        date: dateTimeType('date', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
        startDate: dateTimeType('startDate', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
        endDate: dateTimeType('endDate'),
        durationValue: DataTypes.DECIMAL,
        durationUnit: DataTypes.STRING,
        indication: DataTypes.STRING,
        isPhoneOrder: DataTypes.BOOLEAN,
        notes: DataTypes.STRING,
        pharmacyNotes: DataTypes.STRING,
        displayPharmacyNotesInMar: DataTypes.BOOLEAN,
        quantity: DataTypes.INTEGER,
        discontinued: DataTypes.BOOLEAN,
        discontinuedDate: DataTypes.STRING,
        discontinuingReason: DataTypes.STRING,
        repeats: DataTypes.INTEGER,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        hooks: {
          afterCreate: async (prescription: Prescription) => {
            await models.MedicationAdministrationRecord.generateMedicationAdministrationRecords(
              prescription,
            );
          },
          afterUpdate: async (prescription: Prescription, options) => {
            if (prescription.changed('pharmacyNotes')) {
              await models.Notification.pushNotification(
                NOTIFICATION_TYPES.PHARMACY_NOTE,
                prescription.dataValues,
                { transaction: options.transaction },
              );
            }
          },
        },
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: 'prescriberId',
      as: 'prescriber',
    });
    this.belongsTo(models.User, {
      foreignKey: 'discontinuingClinicianId',
      as: 'discontinuingClinician',
    });

    this.hasOne(models.EncounterPrescription, {
      foreignKey: 'prescriptionId',
      as: 'encounterPrescription',
    });

    this.belongsToMany(models.Encounter, {
      through: models.EncounterPrescription,
      foreignKey: 'prescriptionId',
      as: 'encounters',
    });

    this.belongsToMany(models.Patient, {
      through: models.PatientOngoingPrescription,
      foreignKey: 'prescriptionId',
      as: 'patients',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'medicationId',
      as: 'medication',
    });
    this.hasMany(models.MedicationAdministrationRecord, {
      foreignKey: 'prescriptionId',
      as: 'medicationAdministrationRecords',
    });
  }

  static getListReferenceAssociations() {
    return ['medication', 'prescriber', 'discontinuingClinician'];
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
