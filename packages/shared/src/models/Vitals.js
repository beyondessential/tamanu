import { Sequelize } from 'sequelize';
import { AVPU_OPTIONS, SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';
import { dateTimeType } from './dateTimeTypes';
import { getCurrentDateTimeString } from '../utils/dateTime';

export class Vitals extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        dateRecorded: dateTimeType('dateRecorded', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
        temperature: Sequelize.FLOAT,
        weight: Sequelize.FLOAT,
        height: Sequelize.FLOAT,
        sbp: Sequelize.FLOAT,
        dbp: Sequelize.FLOAT,
        heartRate: Sequelize.FLOAT,
        respiratoryRate: Sequelize.FLOAT,
        spo2: Sequelize.FLOAT,
        avpu: Sequelize.ENUM(AVPU_OPTIONS.map(x => x.value)),
        gcs: Sequelize.FLOAT,
        hemoglobin: Sequelize.FLOAT,
        fastingBloodGlucose: Sequelize.FLOAT,
        urinePh: Sequelize.FLOAT,
        urineLeukocytes: Sequelize.STRING,
        urineNitrites: Sequelize.STRING,
        urobilinogen: Sequelize.FLOAT,
        urineProtein: Sequelize.STRING,
        bloodInUrine: Sequelize.STRING,
        urineSpecificGravity: Sequelize.FLOAT,
        urineKetone: Sequelize.STRING,
        urineBilirubin: Sequelize.STRING,
        urineGlucose: Sequelize.FLOAT,
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

  static initRelations(models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });
  }

  static buildSyncFilter(patientIds) {
    if (patientIds.length === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter([this.tableName, 'encounters']);
  }
}
