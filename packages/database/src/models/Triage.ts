import { Op, DataTypes } from 'sequelize';

import { ENCOUNTER_TYPES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { formatShort, getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
import { buildEncounterLinkedLookupFilter } from '../sync/buildEncounterLinkedLookupFilter';
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
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'secondaryComplaintId',
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

  async update(...args: any): Promise<any> {
    const [data, user] = args;
    const { Encounter, ReferenceData, User } = this.sequelize.models;
    // To collect system note messages describing all changes in this triage update
    const systemNoteRows: string[] = [];

    // Records changes to foreign key columns (e.g., practitionerId, chiefComplaintId)
    // Fetches the related records to get human-readable names for the system note
    const recordForeignKeyChange = async ({
      columnName,
      fieldLabel,
      model,
      sequelizeOptions = {},
      accessor = (record: typeof Model) => record?.name ?? '-',
      onChange,
    }: {
      columnName: keyof Triage;
      fieldLabel: string;
      model: typeof Model;
      sequelizeOptions?: any;
      accessor?: (record: any) => string;
      onChange?: () => Promise<void>;
    }) => {
      const isChanged = columnName in data && data[columnName] !== this[columnName];
      if (!isChanged) return;

      const oldRecord = await model.findByPk(this[columnName], sequelizeOptions);
      const newRecord = await model.findByPk(data[columnName], sequelizeOptions);

      systemNoteRows.push(
        `Changed ${fieldLabel} from '${accessor(oldRecord)}' to '${accessor(newRecord)}'`,
      );
      await onChange?.();
    };

    // Records changes to text/string columns (e.g., score)
    // Uses the raw values directly since there's no related record to fetch
    const recordTextColumnChange = async ({
      columnName,
      fieldLabel,
      formatText = (value: string) => value ?? '-',
      onChange,
    }: {
      columnName: keyof Triage;
      fieldLabel: string;
      formatText?: (value: string) => string;
      onChange?: () => Promise<void>;
    }) => {
      const isChanged = columnName in data && data[columnName] !== this[columnName];
      if (!isChanged) return;

      const oldValue = formatText(this[columnName]);
      const newValue = formatText(data[columnName]);
      systemNoteRows.push(`Changed ${fieldLabel} from '${oldValue}' to '${newValue}'`);
      await onChange?.();
    };

    const updateTriage = async () => {
      await recordForeignKeyChange({
        columnName: 'practitionerId',
        fieldLabel: 'practitioner',
        model: User,
        accessor: (record: any) => record?.displayName ?? '-',
      });
      await recordForeignKeyChange({
        columnName: 'chiefComplaintId',
        fieldLabel: 'chief complaint',
        model: ReferenceData,
      });
      await recordForeignKeyChange({
        columnName: 'secondaryComplaintId',
        fieldLabel: 'secondary complaint',
        model: ReferenceData,
      });
      await recordForeignKeyChange({
        columnName: 'arrivalModeId',
        fieldLabel: 'arrival mode',
        model: ReferenceData,
      });
      await recordTextColumnChange({
        columnName: 'arrivalTime',
        fieldLabel: 'arrival time',
        formatText: formatShort,
      });
      await recordTextColumnChange({
        columnName: 'triageTime',
        fieldLabel: 'triage time',
        formatText: formatShort,
      });
      await recordTextColumnChange({
        columnName: 'closedTime',
        fieldLabel: 'closed time',
        formatText: formatShort,
      });
      await recordTextColumnChange({
        columnName: 'score',
        fieldLabel: 'score',
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
