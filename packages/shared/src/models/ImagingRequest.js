import { Sequelize } from 'sequelize';
import {
  SYNC_DIRECTIONS,
  IMAGING_REQUEST_STATUS_TYPES,
  IMAGING_TYPES_VALUES,
  NOTE_TYPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { getNoteWithType } from '../utils/notes';
import { InvalidOperationError } from '../errors';

import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';
import { dateTimeType } from './dateTimeTypes';
import { getCurrentDateTimeString } from '../utils/dateTime';

const ALL_IMAGING_REQUEST_STATUS_TYPES = Object.values(IMAGING_REQUEST_STATUS_TYPES);

export class ImagingRequest extends Model {
  static init(options) {
    super.init(
      {
        id: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        displayId: {
          type: Sequelize.STRING,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false,
        },

        imagingType: {
          type: Sequelize.ENUM(IMAGING_TYPES_VALUES),
          allowNull: false,
        },
        reasonForCancellation: {
          type: Sequelize.STRING,
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
        // moved into ImagingResults.description
        legacyResults: {
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

  async extractNotes() {
    const notes =
      this.notes ||
      (await this.getNotes({
        where: { visibilityStatus: VISIBILITY_STATUSES.CURRENT },
      }));
    const extractWithType = async type => {
      const note = getNoteWithType(notes, type);
      return note?.content || '';
    };
    return {
      note: await extractWithType(NOTE_TYPES.OTHER),
      areaNote: await extractWithType(NOTE_TYPES.AREA_TO_BE_IMAGED),
      notes,
    };
  }

  static getListReferenceAssociations() {
    return ['requestedBy', 'areas', 'results'];
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

    // Used to be able to explicitly include these (hence no alias)
    this.hasMany(models.ImagingRequestArea, {
      foreignKey: 'imagingRequestId',
    });

    this.hasMany(models.Note, {
      foreignKey: 'recordId',
      as: 'notes',
      constraints: false,
      scope: {
        recordType: this.name,
      },
    });

    this.hasMany(models.ImagingResult, {
      foreignKey: 'imagingRequestId',
      as: 'results',
    });
  }

  static buildPatientSyncFilter(patientIds) {
    if (patientIds.length === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter([this.tableName, 'encounters']);
  }
}
