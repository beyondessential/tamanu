import { Sequelize, Op } from 'sequelize';
import { InvalidOperationError } from '../errors';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { Encounter } from './Encounter';
import { ScheduledVaccine } from './ScheduledVaccine';
import { dateTimeType } from './dateTimeTypes';

export class AdministeredVaccine extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        batch: Sequelize.STRING,
        consent: Sequelize.BOOLEAN,
        consentGivenBy: Sequelize.TEXT,
        status: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        reason: Sequelize.STRING,
        injectionSite: Sequelize.STRING, // conceptually enum(INJECTION_SITE_OPTIONS)
        givenBy: Sequelize.TEXT,
        givenElsewhere: Sequelize.BOOLEAN,
        vaccineBrand: Sequelize.TEXT,
        vaccineName: Sequelize.TEXT,
        disease: Sequelize.TEXT,
        circumstanceIds: Sequelize.ARRAY(Sequelize.STRING),
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

  static initRelations(models) {
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

  static buildSyncFilter(patientIds, { syncAllEncountersForTheseVaccines }) {
    const joins = [];
    const wheres = [];

    if (patientIds.length > 0) {
      joins.push(`
        LEFT JOIN encounters
        ON administered_vaccines.encounter_id = encounters.id
        AND encounters.patient_id IN (:patientIds)
      `);
      wheres.push(`
        encounters.id IS NOT NULL
      `);
    }

    // add any administered vaccines with a vaccine in the list of scheduled vaccines that sync everywhere
    if (syncAllEncountersForTheseVaccines?.length > 0) {
      const escapedVaccineIds = syncAllEncountersForTheseVaccines
        .map(id => this.sequelize.escape(id))
        .join(',');
      joins.push(`
        LEFT JOIN scheduled_vaccines
        ON scheduled_vaccines.id = administered_vaccines.scheduled_vaccine_id
        AND scheduled_vaccines.vaccine_id IN (${escapedVaccineIds})
      `);
      wheres.push(`
        scheduled_vaccines.id IS NOT NULL
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

  static async lastVaccinationForPatient(patientId, vaccineIds = []) {
    const query = {
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
