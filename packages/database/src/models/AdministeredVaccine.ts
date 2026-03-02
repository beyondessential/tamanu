import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { Model } from './Model';
import { Encounter } from './Encounter';
import { ScheduledVaccine } from './ScheduledVaccine';
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import type { User } from './User';
import { buildEncounterLinkedLookupFilter } from '../sync/buildEncounterLinkedLookupFilter';

export class AdministeredVaccine extends Model {
  declare id: string;
  declare batch?: string;
  declare consent?: boolean;
  declare consentGivenBy?: string;
  declare status: string;
  declare reason?: string;
  declare injectionSite?: string;
  declare givenBy?: string;
  declare givenElsewhere?: boolean;
  declare vaccineBrand?: string;
  declare vaccineName?: string;
  declare disease?: string;
  declare circumstanceIds?: string[];
  declare date?: string;
  declare encounterId?: string;
  declare encounter?: Encounter;
  declare scheduledVaccineId?: string;
  declare scheduledVaccine?: ScheduledVaccine;
  declare recorderId?: string;
  declare recorder?: User;
  declare locationId?: string;
  declare departmentId?: string;
  declare notGivenReasonId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        batch: DataTypes.STRING,
        consent: DataTypes.BOOLEAN,
        consentGivenBy: DataTypes.TEXT,
        status: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        reason: DataTypes.STRING,
        injectionSite: DataTypes.STRING, // conceptually enum(INJECTION_SITE_OPTIONS)
        givenBy: DataTypes.TEXT,
        givenElsewhere: DataTypes.BOOLEAN,
        vaccineBrand: DataTypes.TEXT,
        vaccineName: DataTypes.TEXT,
        disease: DataTypes.TEXT,
        circumstanceIds: DataTypes.ARRAY(DataTypes.STRING),
        date: dateTimeType('date'),
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        validate: {
          mustHaveScheduledVaccine() {
            if (!this.deletedAt && !this.scheduledVaccineId) {
              throw new InvalidOperationError(
                'An administered vaccine must have a scheduled vaccine.',
              );
            }
          },
          mustHaveEncounter() {
            if (!this.deletedAt && !this.encounterId) {
              throw new InvalidOperationError('An administered vaccine must have an encounter.');
            }
          },
        },
      },
    );
  }

  static getListReferenceAssociations() {
    return ['encounter', 'scheduledVaccine'];
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });

    this.belongsTo(models.ScheduledVaccine, {
      foreignKey: 'scheduledVaccineId',
      as: 'scheduledVaccine',
    });

    this.belongsTo(models.User, {
      foreignKey: 'recorderId',
      as: 'recorder',
    });

    this.belongsTo(models.Location, {
      foreignKey: 'locationId',
      as: 'location',
    });

    this.belongsTo(models.Department, {
      foreignKey: 'departmentId',
      as: 'department',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'notGivenReasonId',
      as: 'notGivenReason',
    });
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    const joins = [];
    const wheres = [];

    if (patientCount > 0) {
      joins.push(`
        LEFT JOIN encounters
        ON administered_vaccines.encounter_id = encounters.id
        AND encounters.patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable})
      `);
      wheres.push(`
        encounters.id IS NOT NULL
      `);
    }

    if (wheres.length === 0) {
      return null;
    }

    return `
      ${joins.join('\n')}
      WHERE (
        ${wheres.join('\nOR')}
      )
      AND ${this.tableName}.updated_at_sync_tick > :since
    `;
  }

  static async buildSyncLookupQueryDetails() {
    return buildEncounterLinkedLookupFilter(this);
  }

}
