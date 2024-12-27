import { DataTypes, type ModelStatic } from 'sequelize';
import { LAB_REQUEST_STATUSES, SYNC_DIRECTIONS } from '@tamanu/constants';
import {
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from '@tamanu/shared/models/buildEncounterLinkedSyncFilter';
import { Model } from './Model';
import { buildSyncLookupSelect } from '@tamanu/shared/sync/buildSyncLookupSelect';
import { type ModelAttributes } from '../types/sequelize';

const LAB_REQUEST_STATUS_VALUES = Object.values(LAB_REQUEST_STATUSES) as string[];

/** Holds a record of a lab requests status at a specific point in time */
export class LabRequestLog extends Model {
  static init({ primaryKey, sequelize, ...options }: ModelAttributes) {
    super.init(
      {
        id: primaryKey,
        status: DataTypes.ENUM(...LAB_REQUEST_STATUS_VALUES),
      },
      {
        ...options,
        primaryKey,
        sequelize,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(this: ModelStatic<LabRequestLog>, models: { [key: string]: ModelStatic<any> }) {
    this.belongsTo(models.LabRequest!, {
      foreignKey: 'labRequestId',
      as: 'labRequest',
    });

    this.belongsTo(models.User!, {
      foreignKey: 'updatedById',
      as: 'updatedBy',
    });
  }

  static getListReferenceAssociations() {
    return ['labRequest', 'updatedBy'];
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'lab_requests', 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static buildSyncLookupQueryDetails() {
    return {
      select: buildSyncLookupSelect(this, {
        patientId: 'encounters.patient_id',
        isLabRequestValue: 'TRUE',
      }),
      joins: buildEncounterLinkedSyncFilterJoins([this.tableName, 'lab_requests', 'encounters']),
    };
  }
}
