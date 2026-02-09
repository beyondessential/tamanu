import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { buildEncounterLinkedSyncFilter } from '../../sync/buildEncounterLinkedSyncFilter';
import { Model } from '../../models/Model';
import { dateTimeType, dateType, type InitOptions, type Models } from '../../types/model';
import { getCurrentDateString } from '@tamanu/utils/dateTime';
import type { SessionConfig } from '../../types/sync';
import type { LabTestType } from '../../models/LabTestType';
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
} from '../../sync/buildEncounterLinkedLookupFilter';
import { afterCreateHook } from './hooks';

export class LabTest extends Model {
  declare id: string;
  declare date: string;
  declare result: string;
  declare laboratoryOfficer?: string;
  declare verification?: string;
  declare completedDate?: string;
  declare labRequestId?: string;
  declare categoryId?: string;
  declare labTestMethodId?: string;
  declare labTestTypeId?: string;
  declare labTestType?: LabTestType;
  declare referenceRangeMin?: number;
  declare referenceRangeMax?: number;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        date: dateType('date', { allowNull: false, defaultValue: getCurrentDateString }),
        result: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: '',
        },
        laboratoryOfficer: {
          type: DataTypes.STRING,
        },
        verification: {
          type: DataTypes.STRING,
        },
        completedDate: dateTimeType('completedDate'),
        referenceRangeMin: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        referenceRangeMax: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        hooks: {
          afterCreate: afterCreateHook,
        },
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.LabRequest, {
      foreignKey: 'labRequestId',
      as: 'labRequest',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'categoryId',
      as: 'category',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'labTestMethodId',
      as: 'labTestMethod',
    });

    this.belongsTo(models.LabTestType, {
      foreignKey: 'labTestTypeId',
      as: 'labTestType',
    });
  }

  static getListReferenceAssociations() {
    return ['category', 'labTestType', 'labTestMethod'];
  }

  static buildPatientSyncFilter(
    patientCount: number,
    markedForSyncPatientsTable: string,
    sessionConfig: SessionConfig,
  ) {
    if (sessionConfig.syncAllLabRequests) {
      return ''; // include all lab tests
    }
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'lab_requests', 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterLinkedLookupSelect(this, {
        isLabRequestValue: 'TRUE',
      }),
      joins: buildEncounterLinkedLookupJoins(this, ['lab_requests', 'encounters']),
    };
  }
}
