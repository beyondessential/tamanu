import { Op, Sequelize } from 'sequelize';

import { ENCOUNTER_TYPES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/shared/errors';

import { Model } from './Model';
import {
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from '../sync/buildEncounterLinkedSyncFilter';
import { dateTimeType } from '../types/model';
import { buildEncounterPatientIdSelect } from '../sync/buildPatientLinkedLookupFilter';

export class Triage extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        arrivalTime: dateTimeType('arrivalTime'),
        triageTime: dateTimeType('triageTime'),
        closedTime: dateTimeType('closedTime'),
        score: Sequelize.TEXT,
      },
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, ...options },
    );
  }

  static initRelations(models) {
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

  static buildPatientSyncFilter(patientCount, markedForSyncPatientsTable) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static buildSyncLookupQueryDetails() {
    return {
      select: buildEncounterPatientIdSelect(this),
      joins: buildEncounterLinkedSyncFilterJoins([this.tableName, 'encounters']),
    };
  }

  static async create(data) {
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
      [data.chiefComplaintId, data.secondaryComplaintId].map((x) => ReferenceData.findByPk(x)),
    );

    // TODO: to handle translations for triage reason for encounter
    const reasonsText = reasons
      .filter((x) => x)
      .map((x) => x.name)
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
}
