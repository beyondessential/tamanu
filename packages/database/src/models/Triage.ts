import { Op, DataTypes } from 'sequelize';
import config from 'config';

import { ENCOUNTER_TYPES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { formatShortDateTime } from '@tamanu/utils/dateFormatters';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
import { buildEncounterLinkedLookupFilter } from '../sync/buildEncounterLinkedLookupFilter';
import { createChangeRecorders } from '../utils/recordModelChanges';
import { dateTimeType, type InitOptions, type Models } from '../types/model';

export class Triage extends Model {
  declare id: string;
  declare arrivalTime?: string;
  declare triageTime?: string;
  declare closedTime?: string;
  declare score?: string;
  declare encounterId?: string;
  declare practitionerId?: string;
  declare chiefComplaintId?: string;
  declare secondaryComplaintId?: string;
  declare arrivalModeId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        arrivalTime: dateTimeType('arrivalTime'),
        triageTime: dateTimeType('triageTime'),
        closedTime: dateTimeType('closedTime'),
        score: DataTypes.TEXT,
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });

    this.belongsTo(models.User, {
      as: 'Practitioner',
      foreignKey: 'practitionerId',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'chiefComplaintId',
      as: 'chiefComplaint',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'secondaryComplaintId',
      as: 'secondaryComplaint',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'arrivalModeId',
      as: 'arrivalMode',
    });

    this.hasMany(models.Note, {
      foreignKey: 'recordId',
      as: 'notes',
      constraints: false,
      scope: {
        recordType: this.name,
      },
    });
  }

  static getListReferenceAssociations() {
    return ['chiefComplaint', 'secondaryComplaint'];
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

  static async create(data: any): Promise<any> {
    const { Encounter, ReferenceData } = this.sequelize.models;

    const existingEncounter = await Encounter.findOne({
      where: {
        endDate: {
          [Op.is]: null,
        },
        patientId: data.patientId,
      },
    });

    if (existingEncounter) {
      throw new InvalidOperationError("Can't triage a patient that has an existing encounter");
    }

    const reasons = await Promise.all(
      [data.chiefComplaintId, data.secondaryComplaintId].map(x => ReferenceData.findByPk(x)),
    );

    // TODO: to handle translations for triage reason for encounter
    const reasonsText = reasons
      .filter(x => x)
      .map(x => x?.name)
      .join(' and ');
    const reasonForEncounter = `Presented at emergency department with ${reasonsText}`;

    return this.sequelize.transaction(async () => {
      const encounter = await Encounter.create({
        encounterType: ENCOUNTER_TYPES.TRIAGE,
        startDate: data.triageTime,
        reasonForEncounter,
        patientId: data.patientId,
        departmentId: data.departmentId,
        locationId: data.locationId,
        examinerId: data.practitionerId,
        actorId: data.actorId,
      });

      return super.create({
        ...data,
        encounterId: encounter.id,
      });
    });
  }

  async update(data: any, user?: any): Promise<any> {
    const { Encounter, ReferenceData } = this.sequelize.models;
    // To collect system note messages describing all changes in this triage update
    const systemNoteRows: string[] = [];

    const { onChangeForeignKey, onChangeTextColumn } = createChangeRecorders(
      this,
      data,
      systemNoteRows,
    );

    const updateTriage = async () => {
      await onChangeForeignKey({
        columnName: 'chiefComplaintId',
        noteLabel: 'chief complaint',
        model: ReferenceData,
      });
      await onChangeForeignKey({
        columnName: 'secondaryComplaintId',
        noteLabel: 'secondary complaint',
        model: ReferenceData,
      });
      await onChangeForeignKey({
        columnName: 'arrivalModeId',
        noteLabel: 'arrival mode',
        model: ReferenceData,
      });
      await onChangeTextColumn({
        columnName: 'arrivalTime',
        noteLabel: 'arrival date & time',
        formatText: date => (date ? formatShortDateTime(date, config.primaryTimeZone) : '-'),
      });
      await onChangeTextColumn({
        columnName: 'triageTime',
        noteLabel: 'triage date & time',
        formatText: date => (date ? formatShortDateTime(date, config.primaryTimeZone) : '-'),
      });
      await onChangeTextColumn({
        columnName: 'score',
        noteLabel: 'triage score',
      });

      const { submittedTime, ...triageData } = data;
      const updatedTriage = await super.update(triageData, user);

      if (systemNoteRows.length > 0) {
        const encounter = await Encounter.findByPk(this.encounterId);
        if (encounter) {
          const formattedSystemNote = systemNoteRows.map(row => `• ${row}`).join('\n');
          await encounter.addSystemNote(
            formattedSystemNote,
            submittedTime || getCurrentDateTimeString(),
            user,
          );
        }
      }

      return updatedTriage;
    };

    if (this.sequelize.isInsideTransaction()) {
      return updateTriage();
    }

    // If the update is not already in a transaction, wrap it in one
    // Having nested transactions can cause bugs in postgres so only conditionally wrap
    return this.sequelize.transaction(async () => {
      return await updateTriage();
    });
  }
}
