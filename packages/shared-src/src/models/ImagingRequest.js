import { Sequelize } from 'sequelize';

import { InvalidOperationError } from 'shared/errors';

import { SYNC_DIRECTIONS, IMAGING_REQUEST_STATUS_TYPES, IMAGING_TYPES } from 'shared/constants';

import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';
import { dateTimeType } from './dateTimeTypes';
import { getCurrentDateTimeString } from '../utils/dateTime';

const ALL_IMAGING_REQUEST_STATUS_TYPES = Object.values(IMAGING_REQUEST_STATUS_TYPES);
const ALL_IMAGING_TYPES = Object.values(IMAGING_TYPES);
export class ImagingRequest extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        imagingType: {
          type: Sequelize.ENUM(ALL_IMAGING_TYPES),
          allowNull: false,
        },

        status: {
          type: Sequelize.ENUM(ALL_IMAGING_REQUEST_STATUS_TYPES),
          allowNull: false,
          defaultValue: IMAGING_REQUEST_STATUS_TYPES.PENDING,
        },

        requestedDate: dateTimeType('requestedDate', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),

        results: {
          type: Sequelize.TEXT,
          defaultValue: '',
        },

        priority: {
          type: Sequelize.STRING,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        validate: {
          mustHaveValidRequestStatusType() {
            if (!ALL_IMAGING_REQUEST_STATUS_TYPES.includes(this.status)) {
              throw new InvalidOperationError('An imaging request must have a valid status.');
            }
          },
          mustHaveValidRequester() {
            if (!this.requestedById) {
              throw new InvalidOperationError('An imaging request must have a valid requester.');
            }
          },
        },
      },
    );
  }

  static getListReferenceAssociations() {
    return ['requestedBy', 'areas'];
  }

  static initRelations(models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });

    this.belongsTo(models.User, {
      foreignKey: 'requestedById',
      as: 'requestedBy',
    });

    this.belongsTo(models.User, {
      foreignKey: 'completedById',
      as: 'completedBy',
    });

    this.belongsTo(models.LocationGroup, {
      as: 'locationGroup',
      foreignKey: 'locationGroupId',
    });

    // Imaging Requests are assigned a Location Group but the Location relation exists for legacy data
    this.belongsTo(models.Location, {
      foreignKey: 'locationId',
      as: 'location',
    });

    this.belongsToMany(models.ReferenceData, {
      through: models.ImagingRequestArea,
      as: 'areas',
      foreignKey: 'imagingRequestId',
    });

    this.hasMany(models.NotePage, {
      foreignKey: 'recordId',
      as: 'notePages',
      constraints: false,
      scope: {
        recordType: this.name,
      },
    });
  }

  static buildSyncFilter(patientIds) {
    if (patientIds.length === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter([this.tableName, 'encounters']);
  }
}
