import { DataTypes, Sequelize } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/shared/errors';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { Model } from './Model';
import {
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from '../sync/buildEncounterLinkedSyncFilter';
import { buildEncounterPatientIdSelect } from '../sync/buildPatientLinkedLookupFilter';
import { dateTimeType, type InitOptions, type Models } from '../types/model';

export class ImagingResult extends Model {
  id!: string;
  visibilityStatus!: string;
  completedAt!: string;
  description?: string;
  externalCode?: string;
  imagingRequestId?: string;
  completedById?: string;

  static initModel(options: InitOptions) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.fn('uuid_generate_v4'),
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

  static buildSyncLookupQueryDetails() {
    return {
      select: buildEncounterPatientIdSelect(this),
      joins: buildEncounterLinkedSyncFilterJoins([
        this.tableName,
        'imaging_requests',
        'encounters',
      ]),
    };
  }
}
