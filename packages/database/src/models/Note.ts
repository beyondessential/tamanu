import { DataTypes } from 'sequelize';
import {
  NOTE_RECORD_TYPE_VALUES,
  REFERENCE_TYPES,
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
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import { buildEncounterLinkedLookupSelect } from '../sync/buildEncounterLinkedLookupFilter';

export interface CreateNoteParams {
  noteType: string;
  content: string;
  authorId: string;
  recordType?: string;
  recordId?: string;
  date?: string;
  dateLegacy?: Date;
  onBehalfOfId?: string;
  revisedById?: string;
  visibilityStatus?: string;
}

export class Note extends Model {
  declare id: string;
  declare noteType: string;
  declare noteTypeId?: string;
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
          allowNull: true,
        },
        noteTypeId: {
          type: DataTypes.STRING(255),
          allowNull: true,
          references: {
            model: 'ReferenceData',
            key: 'id',
          },
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

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'noteTypeId',
      as: 'noteTypeReference',
    });
  }

  static async createForRecord(
    recordId: string,
    recordType: string,
    noteType: string,
    content: string,
    authorId: string,
  ) {
    const { models } = this.sequelize;
    const noteTypeReference = await models.ReferenceData.findOne({
      where: {
        type: REFERENCE_TYPES.NOTE_TYPE,
        code: noteType,
      },
    });

    return Note.create({
      recordId,
      recordType,
      noteType,
      noteTypeId: noteTypeReference?.id,
      date: getCurrentDateTimeString(),
      content,
      authorId,
    });
  }

  static async createWithNoteType(params: CreateNoteParams) {
    const { noteType } = params;
    const { models } = this.sequelize;
    const noteTypeReference = await models.ReferenceData.findOne({
      where: {
        type: REFERENCE_TYPES.NOTE_TYPE,
        code: noteType,
      },
    });

    return Note.create({
      ...params,
      noteTypeId: noteTypeReference?.id,
    });
  }

  async getParentRecord(options: any) {
    if (!this.recordType) {
      return null;
    }
    const parentGetter = `get${this.recordType}`;
    return (this as any)[parentGetter](options);
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterLinkedLookupSelect(this, {
        patientId: getPatientIdColumnOfNotes(),
      }),
      joins: buildNoteLinkedJoins().join('\n'),
    };
  }

  static buildPatientSyncFilter = buildNoteLinkedSyncFilter;
}
