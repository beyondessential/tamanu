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
  declare id: string;
  declare dateRecorded: string;
  declare temperature?: number;
  declare weight?: number;
  declare height?: number;
  declare sbp?: number;
  declare dbp?: number;
  declare heartRate?: number;
  declare respiratoryRate?: number;
  declare spo2?: number;
  declare avpu?: (typeof AVPU_VALUES)[number];
  declare gcs?: number;
  declare hemoglobin?: number;
  declare fastingBloodGlucose?: number;
  declare urinePh?: number;
  declare urineLeukocytes?: string;
  declare urineNitrites?: string;
  declare urobilinogen?: number;
  declare urineProtein?: string;
  declare bloodInUrine?: string;
  declare urineSpecificGravity?: number;
  declare urineKetone?: string;
  declare urineBilirubin?: string;
  declare urineGlucose?: number;
  declare encounterId?: string;

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

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterPatientIdSelect(this),
      joins: buildEncounterLinkedSyncFilterJoins([this.tableName, 'encounters']),
    };
  }
}
