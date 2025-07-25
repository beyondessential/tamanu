import { DataTypes } from 'sequelize';
import {
  NOTE_RECORD_TYPE_VALUES,
  NOTE_TYPE_VALUES,
  SYNC_DIRECTIONS,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { Model } from './Model';
import {
  buildNoteLinkedJoins,
  buildNoteLinkedSyncFilter,
  getPatientIdColumnOfNotes,
} from '../sync/buildNoteLinkedSyncFilter';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import { addSensitiveFacilityIdIfApplicable } from '../sync/buildEncounterLinkedLookupFilter';

export class Note extends Model {
  declare id: string;
  declare noteType: string;
  declare recordType: string;
  declare date: string;
  declare content: string;
  declare visibilityStatus: string;
  declare authorId?: string;
  declare onBehalfOfId?: string;
  declare revisedById?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: {
          ...primaryKey,
          type: DataTypes.UUID,
        },
        noteType: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        recordType: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        date: dateTimeType('date', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: '',
        },
        visibilityStatus: {
          type: DataTypes.TEXT,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        validate: {
          mustHaveValidRelationType() {
            if (!NOTE_RECORD_TYPE_VALUES.includes(this.recordType as string)) {
              throw new Error(`Note: Must have a valid record type (got ${this.recordType})`);
            }
          },
          mustHaveValidType() {
            if (!NOTE_TYPE_VALUES.includes(this.noteType as string)) {
              throw new Error(`Note: Must have a valid note type (got ${this.noteType})`);
            }
          },
        },
      },
    );
  }

  static initRelations(models: Models) {
    NOTE_RECORD_TYPE_VALUES.forEach(modelName => {
      this.belongsTo(models[modelName as keyof Models] as typeof Model, {
        foreignKey: 'recordId',
        as: `${modelName.charAt(0).toLowerCase()}${modelName.slice(1)}`, // lower case first letter
        constraints: false,
      });
    });

    this.belongsTo(models.User, {
      foreignKey: 'authorId',
      as: 'author',
    });

    this.belongsTo(models.User, {
      foreignKey: 'onBehalfOfId',
      as: 'onBehalfOf',
    });

    this.belongsTo(models.Note, {
      foreignKey: 'revisedById',
      as: 'revisedBy',
      constraints: false,
    });
  }

  static async createForRecord(
    recordId: string,
    recordType: string,
    noteType: string,
    content: string,
    authorId: string,
  ) {
    return Note.create({
      recordId,
      recordType,
      noteType,
      date: getCurrentDateTimeString(),
      content,
      authorId,
    });
  }

  async getParentRecord(options: any) {
    if (!this.recordType) {
      return null;
    }
    const parentGetter = `get${this.recordType}`;
    return (this as any)[parentGetter](options);
  }

  static buildSyncLookupQueryDetails() {
    // For Notes, we need to handle the polymorphic relationships
    // Use the original note-linked joins but add sensitive facility logic
    const noteJoins = buildNoteLinkedJoins();

    // Add joins to get to facilities for sensitive facility filtering
    // Use the existing aliased encounters joins and add locations/facilities
    const facilityJoins = `
      LEFT JOIN locations ON (
        (notes.record_type = 'Encounter' AND encounters.location_id = locations.id) OR
        (notes.record_type = 'Triage' AND triages_encounters.location_id = locations.id) OR
        (notes.record_type = 'LabRequest' AND lab_requests_encounters.location_id = locations.id) OR
        (notes.record_type = 'ImagingRequest' AND imaging_requests_encounters.location_id = locations.id)
      )
      LEFT JOIN facilities ON locations.facility_id = facilities.id
    `;

    return {
      select: buildSyncLookupSelect(this, {
        patientId: getPatientIdColumnOfNotes(),
        facilityId: addSensitiveFacilityIdIfApplicable(),
      }),
      joins: noteJoins.join('\n') + '\n' + facilityJoins,
    };
  }

  static buildPatientSyncFilter = buildNoteLinkedSyncFilter;
}
