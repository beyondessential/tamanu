import { DataTypes, Sequelize } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
} from '../sync/buildEncounterLinkedLookupFilter';

export class ImagingResult extends Model {
  declare id: string;
  declare visibilityStatus: string;
  declare completedAt: string;
  declare description?: string;
  declare externalCode?: string;
  declare imagingRequestId?: string;
  declare completedById?: string;

  static initModel(options: InitOptions) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.fn('gen_random_uuid'),
        },
        visibilityStatus: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'current',
        },
        completedAt: dateTimeType('completedAt', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
        description: {
          type: DataTypes.TEXT,
        },
        externalCode: DataTypes.TEXT,
        resultImageUrl: {
          type: DataTypes.TEXT,
          defaultValue: null,
          allowNull: true,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        validate: {
          mustHaveImagingRequest() {
            if (!this.imagingRequestId) {
              throw new InvalidOperationError(
                'An imaging result must be associated with an imaging request.',
              );
            }
          },
        },
      },
    );
  }

  static getListReferenceAssociations() {
    return ['request', 'completedBy'];
  }

  static initRelations(models: Models) {
    this.belongsTo(models.ImagingRequest, {
      foreignKey: 'imagingRequestId',
      as: 'request',
    });

    this.belongsTo(models.User, {
      foreignKey: 'completedById',
      as: 'completedBy',
    });
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'imaging_requests', 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterLinkedLookupSelect(this),
      joins: buildEncounterLinkedLookupJoins(this, ['imaging_requests', 'encounters']),
    };
  }
}
