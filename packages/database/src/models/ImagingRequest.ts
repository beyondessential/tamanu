import { DataTypes } from 'sequelize';
import {
  IMAGING_REQUEST_STATUS_TYPES,
  IMAGING_TYPES_VALUES,
  NOTE_TYPES,
  SYNC_DIRECTIONS,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { getNoteWithType } from '@tamanu/shared/utils/notes';
import { InvalidOperationError } from '@tamanu/shared/errors';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
import { buildEncounterLinkedLookupFilter } from '../sync/buildEncounterLinkedLookupFilter';
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import type { ImagingRequestArea } from './ImagingRequestArea';
import type { Encounter } from './Encounter';
import type { User } from './User';
import type { Note } from './Note';
import type { Location } from './Location';
import type { LocationGroup } from './LocationGroup';

const ALL_IMAGING_REQUEST_STATUS_TYPES = Object.values(IMAGING_REQUEST_STATUS_TYPES);

export class ImagingRequest extends Model {
  id!: string;
  displayId!: string;
  imagingType!: (typeof IMAGING_TYPES_VALUES)[number];
  reasonForCancellation?: string;
  status!: (typeof ALL_IMAGING_REQUEST_STATUS_TYPES)[number];
  requestedDate!: string;
  legacyResults!: string;
  priority?: string;
  encounterId?: string;
  requestedById!: string;
  completedById?: string;
  locationGroupId?: string;
  locationId?: string;

  areas!: ImagingRequestArea[];
  encounter?: Encounter;
  requestedBy?: User;
  notes!: Note[];
  location?: Location;
  locationGroup?: LocationGroup;

  static initModel(options: InitOptions) {
    super.init(
      {
        id: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        displayId: {
          type: DataTypes.STRING,
          defaultValue: DataTypes.UUIDV4,
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
      },
    );
  }

  async extractNotes() {
    const notes =
      this.notes ||
      (await (this as any).getNotes({
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

  static buildSyncLookupQueryDetails() {
    return buildEncounterLinkedLookupFilter(this);
  }
}
