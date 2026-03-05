import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from '../Model';
import { dateTimeType, type InitOptions, type Models } from '../../types/model';
import { buildEncounterLinkedLookupSelect } from '../../sync/buildEncounterLinkedLookupFilter';
import {
  afterCreateHook,
  afterUpdateHook,
  afterDestroyHook,
  afterBulkDestroyHook,
  afterBulkCreateHook,
  afterBulkUpdateHook,
} from './hooks';

export class MedicationAdministrationRecordDose extends Model {
  declare id: string;
  declare doseAmount: number;
  declare doseIndex: number;
  declare isRemoved: boolean;
  declare reasonForRemoval?: string;
  declare reasonForChange?: string;
  declare givenTime: Date;
  declare givenByUserId: string;
  declare recordedByUserId: string;
  declare marId: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        doseAmount: {
          type: DataTypes.DECIMAL,
          allowNull: false,
        },
        givenTime: dateTimeType('givenTime', {
          allowNull: false,
        }),
        givenByUserId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        recordedByUserId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        marId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        isRemoved: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
        },
        doseIndex: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        reasonForRemoval: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        reasonForChange: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        hooks: {
          afterCreate: afterCreateHook,
          afterBulkCreate: afterBulkCreateHook,
          afterUpdate: afterUpdateHook,
          afterBulkUpdate: afterBulkUpdateHook,
          afterDestroy: afterDestroyHook,
          afterBulkDestroy: afterBulkDestroyHook,
        },
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.MedicationAdministrationRecord, {
      foreignKey: 'marId',
      as: 'medicationAdministrationRecord',
    });
    this.belongsTo(models.User, {
      foreignKey: 'givenByUserId',
      as: 'givenByUser',
    });
    this.belongsTo(models.User, {
      foreignKey: 'recordedByUserId',
      as: 'recordedByUser',
    });
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return `
      LEFT JOIN medication_administration_records ON medication_administration_record_doses.mar_id = medication_administration_records.id
      LEFT JOIN encounter_prescriptions ON medication_administration_records.prescription_id = encounter_prescriptions.prescription_id
      LEFT JOIN encounters ON encounter_prescriptions.encounter_id = encounters.id
      LEFT JOIN patient_ongoing_prescriptions ON medication_administration_records.prescription_id = patient_ongoing_prescriptions.prescription_id
      WHERE (
        (encounters.patient_id IS NOT NULL AND encounters.patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable}))
        OR
        (patient_ongoing_prescriptions.patient_id IS NOT NULL AND patient_ongoing_prescriptions.patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable}))
      )
      AND medication_administration_record_doses.updated_at_sync_tick > :since
    `;
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterLinkedLookupSelect(this, {
        patientId: 'COALESCE(encounters.patient_id, patient_ongoing_prescriptions.patient_id)',
      }),
      joins: `
        LEFT JOIN medication_administration_records ON medication_administration_record_doses.mar_id = medication_administration_records.id
        LEFT JOIN encounter_prescriptions ON medication_administration_records.prescription_id = encounter_prescriptions.prescription_id
        LEFT JOIN encounters ON encounter_prescriptions.encounter_id = encounters.id
        LEFT JOIN patient_ongoing_prescriptions ON medication_administration_records.prescription_id = patient_ongoing_prescriptions.prescription_id
        LEFT JOIN locations ON encounters.location_id = locations.id
        LEFT JOIN facilities ON locations.facility_id = facilities.id
      `,
    };
  }
}
