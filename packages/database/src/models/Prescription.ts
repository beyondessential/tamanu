import { DataTypes } from 'sequelize';
import { NOTIFICATION_TYPES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { Model } from './Model';
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import { buildSyncLookupSelect } from 'sync';

export class Prescription extends Model {
  declare id: string;
  declare isOngoing?: boolean;
  declare isPrn?: boolean;
  declare isVariableDose?: boolean;
  declare doseAmount: number;
  declare units: string;
  declare frequency: string;
  declare idealTimes?: string[];
  declare route: string;
  declare date: string;
  declare startDate: string;
  declare endDate?: string;
  declare durationValue?: number | null;
  declare durationUnit?: string | null;
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
            if (prescription.durationValue && prescription.durationUnit) {
              const { add } = await import('date-fns');
              prescription.endDate = add(new Date(prescription.startDate), {
                [prescription.durationUnit]: prescription.durationValue,
              }).toISOString();
            }
            await prescription.save();
          },
          afterUpdate: async (prescription: Prescription, options) => {
            if (prescription.changed('pharmacyNotes')) {
              await models.Notification.pushNotification(
                NOTIFICATION_TYPES.PHARMACY_NOTE,
                prescription.dataValues,
                { transaction: options.transaction },
              );
            }
            if (prescription.changed('discontinued') && prescription.discontinued) {
              await models.MedicationAdministrationRecord.removeInvalidMedicationAdministrationRecords(
                options.transaction,
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

    this.hasOne(models.PatientOngoingPrescription, {
      foreignKey: 'prescriptionId',
      as: 'patientOngoingPrescription',
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

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return `
      LEFT JOIN encounter_prescriptions ON prescriptions.id = encounter_prescriptions.prescription_id
      LEFT JOIN encounters ON encounter_prescriptions.encounter_id = encounters.id
      LEFT JOIN patient_ongoing_prescriptions ON prescriptions.id = patient_ongoing_prescriptions.prescription_id
      WHERE (
        (encounters.patient_id IS NOT NULL AND encounters.patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable}))
        OR 
        (patient_ongoing_prescriptions.patient_id IS NOT NULL AND patient_ongoing_prescriptions.patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable}))
      )
      AND prescriptions.updated_at_sync_tick > :since
    `;
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildSyncLookupSelect(this, {
        patientId: 'COALESCE(encounters.patient_id, patient_ongoing_prescriptions.patient_id)',
        facilityId: `CASE WHEN ${this.tableName}.is_ongoing THEN NULL ELSE COALESCE(location_groups.facility_id, locations.facility_id) END`, // Sync ongoing prescriptions to all facilities
      }),
      joins: `
        LEFT JOIN encounter_prescriptions ON prescriptions.id = encounter_prescriptions.prescription_id
        LEFT JOIN encounters ON encounter_prescriptions.encounter_id = encounters.id
        LEFT JOIN patient_ongoing_prescriptions ON prescriptions.id = patient_ongoing_prescriptions.prescription_id
        LEFT JOIN locations ON encounters.location_id = locations.id
        LEFT JOIN facilities ON locations.facility_id = facilities.id
      `,
    };
  }
}
