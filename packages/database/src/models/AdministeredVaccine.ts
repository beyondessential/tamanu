import { Op, DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/shared/errors';
import { Model } from './Model';
import { Encounter } from './Encounter';
import { ScheduledVaccine } from './ScheduledVaccine';
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import { buildEncounterLinkedSyncFilterJoins } from '../sync/buildEncounterLinkedSyncFilter';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';
import type { User } from './User';

export class AdministeredVaccine extends Model {
  id!: string;
  batch?: string;
  consent?: boolean;
  consentGivenBy?: string;
  status!: string;
  reason?: string;
  injectionSite?: string;
  givenBy?: string;
  givenElsewhere?: boolean;
  vaccineBrand?: string;
  vaccineName?: string;
  disease?: string;
  circumstanceIds?: string[];
  date?: string;
  encounterId?: string;
  encounter?: Encounter;
  scheduledVaccineId?: string;
  scheduledVaccine?: ScheduledVaccine;
  recorderId?: string;
  recorder?: User;
  locationId?: string;
  departmentId?: string;
  notGivenReasonId?: string;

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

  static buildSyncLookupQueryDetails() {
    return {
      select: buildSyncLookupSelect(this, {
        patientId: 'encounters.patient_id',
        encounterId: 'encounters.id',
      }),
      joins: buildEncounterLinkedSyncFilterJoins([this.tableName, 'encounters']),
    };
  }

  static async lastVaccinationForPatient(patientId: string, vaccineIds: string[] = []) {
    const query: Record<string, any> = {
      where: {
        '$encounter.patient_id$': patientId,
        status: 'GIVEN',
      },
      order: [['date', 'DESC']],
      include: [
        {
          model: Encounter,
          as: 'encounter',
        },
      ],
    };

    if (vaccineIds.length) {
      query.where['$scheduledVaccine.vaccine_id$'] = {
        [Op.in]: vaccineIds,
      };

      query.include.push({
        model: ScheduledVaccine,
        as: 'scheduledVaccine',
      });
    }

    return AdministeredVaccine.findOne(query);
  }
}
