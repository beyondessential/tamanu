import { DataTypes, Sequelize } from 'sequelize';
import {
  IMAGING_REQUEST_STATUS_TYPES,
  IMAGING_TYPES_VALUES,
  NOTE_RECORD_TYPES,
  NOTE_TYPES,
  SYNC_DIRECTIONS,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { getNoteWithType } from '@tamanu/shared/utils/notes';
import { InvalidOperationError } from '@tamanu/errors';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { Model } from '../Model';
import { buildEncounterLinkedSyncFilter } from '../../sync/buildEncounterLinkedSyncFilter';
import { buildEncounterLinkedLookupFilter } from '../../sync/buildEncounterLinkedLookupFilter';
import { dateTimeType, type InitOptions, type Models } from '../../types/model';
import type { ImagingRequestArea } from '../ImagingRequestArea';
import type { Encounter } from '../Encounter';
import type { User } from '../User';
import type { Note } from '../Note';
import type { Location } from '../Location';
import type { LocationGroup } from '../LocationGroup';
import { afterCreateHook, afterUpdateHook } from './hooks';

const ALL_IMAGING_REQUEST_STATUS_TYPES = Object.values(IMAGING_REQUEST_STATUS_TYPES);

export class ImagingRequest extends Model {
  declare id: string;
  declare displayId: string;
  declare imagingType: (typeof IMAGING_TYPES_VALUES)[number];
  declare reasonForCancellation?: string;
  declare status: (typeof ALL_IMAGING_REQUEST_STATUS_TYPES)[number];
  declare requestedDate: string;
  declare legacyResults: string;
  declare priority?: string;
  declare encounterId?: string;
  declare requestedById: string;
  declare completedById?: string;
  declare locationGroupId?: string;
  declare locationId?: string;

  declare areas: ImagingRequestArea[];
  declare encounter?: Encounter;
  declare requestedBy?: User;
  declare notes: Note[];
  declare location?: Location;
  declare locationGroup?: LocationGroup;

  static initModel(options: InitOptions) {
    super.init(
      {
        id: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: Sequelize.fn('gen_random_uuid'),
          primaryKey: true,
        },
        displayId: {
          type: DataTypes.STRING,
          defaultValue: Sequelize.fn('gen_random_uuid'),
          allowNull: false,
        },

        imagingType: {
          type: DataTypes.ENUM(...IMAGING_TYPES_VALUES),
          allowNull: false,
        },
        reasonForCancellation: {
          type: DataTypes.STRING,
        },
        status: {
          type: DataTypes.ENUM(...ALL_IMAGING_REQUEST_STATUS_TYPES),
          allowNull: false,
          defaultValue: IMAGING_REQUEST_STATUS_TYPES.PENDING,
        },
        requestedDate: dateTimeType('requestedDate', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
        // moved into ImagingResults.description
        legacyResults: {
          type: DataTypes.TEXT,
          defaultValue: '',
        },
        priority: {
          type: DataTypes.STRING,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        validate: {
          mustHaveValidRequestStatusType() {
            if (!ALL_IMAGING_REQUEST_STATUS_TYPES.includes(this.status as string)) {
              throw new InvalidOperationError('An imaging request must have a valid status.');
            }
          },
          mustHaveValidRequester() {
            if (!this.requestedById) {
              throw new InvalidOperationError('An imaging request must have a valid requester.');
            }
          },
        },
        hooks: {
          afterCreate: afterCreateHook,
          afterUpdate: afterUpdateHook,
        },
      },
    );
  }

  async getNotes(options: any = {}) {
    const { models } = this.sequelize;

    return models.Note.findAll({
      where: {
        recordId: this.id,
        recordType: NOTE_RECORD_TYPES.IMAGING_REQUEST,
        ...options.where,
      },
      include: [
        {
          model: models.ReferenceData,
          as: 'noteTypeReference',
        },
        ...(options.include || []),
      ],
    });
  }

  async extractNotes() {
    const notes =
      this.notes ||
      (await this.getNotes({
        where: { visibilityStatus: VISIBILITY_STATUSES.CURRENT },
      }));
    const extractWithType = async (type: string) => {
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

  static initRelations(models: Models) {
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

    this.hasOne(models.ImagingTypeExternalCode, {
      sourceKey: 'imagingType',
      foreignKey: 'imagingTypeCode',
      as: 'imagingTypeExternalCode',
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
    return buildEncounterLinkedLookupFilter(this);
  }
}
