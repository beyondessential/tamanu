import { DataTypes } from 'sequelize';
import { AVPU_OPTIONS, SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import {
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from '../sync/buildEncounterLinkedSyncFilter';
import { buildEncounterPatientIdSelect } from '../sync/buildPatientLinkedLookupFilter';
import { dateTimeType, type InitOptions, type Models } from '../types/model';

const AVPU_VALUES = AVPU_OPTIONS.map((x) => x.value);

export class Vitals extends Model {
  id!: string;
  dateRecorded!: string;
  temperature?: number;
  weight?: number;
  height?: number;
  sbp?: number;
  dbp?: number;
  heartRate?: number;
  respiratoryRate?: number;
  spo2?: number;
  avpu?: (typeof AVPU_VALUES)[number];
  gcs?: number;
  hemoglobin?: number;
  fastingBloodGlucose?: number;
  urinePh?: number;
  urineLeukocytes?: string;
  urineNitrites?: string;
  urobilinogen?: number;
  urineProtein?: string;
  bloodInUrine?: string;
  urineSpecificGravity?: number;
  urineKetone?: string;
  urineBilirubin?: string;
  urineGlucose?: number;
  encounterId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,

        dateRecorded: dateTimeType('dateRecorded', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
        temperature: DataTypes.FLOAT,
        weight: DataTypes.FLOAT,
        height: DataTypes.FLOAT,
        sbp: DataTypes.FLOAT,
        dbp: DataTypes.FLOAT,
        heartRate: DataTypes.FLOAT,
        respiratoryRate: DataTypes.FLOAT,
        spo2: DataTypes.FLOAT,
        avpu: DataTypes.ENUM(...AVPU_VALUES),
        gcs: DataTypes.FLOAT,
        hemoglobin: DataTypes.FLOAT,
        fastingBloodGlucose: DataTypes.FLOAT,
        urinePh: DataTypes.FLOAT,
        urineLeukocytes: DataTypes.STRING,
        urineNitrites: DataTypes.STRING,
        urobilinogen: DataTypes.FLOAT,
        urineProtein: DataTypes.STRING,
        bloodInUrine: DataTypes.STRING,
        urineSpecificGravity: DataTypes.FLOAT,
        urineKetone: DataTypes.STRING,
        urineBilirubin: DataTypes.STRING,
        urineGlucose: DataTypes.FLOAT,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        validate: {
          mustHaveEncounter() {
            if (!this.encounterId) {
              throw new Error('A vitals reading must be attached to an encounter.');
            }
          },
        },
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
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
    return {
      select: buildEncounterPatientIdSelect(this),
      joins: buildEncounterLinkedSyncFilterJoins([this.tableName, 'encounters']),
    };
  }
}
