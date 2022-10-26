import { Sequelize, Op } from 'sequelize';
import config from 'config';
import { InvalidOperationError } from 'shared/errors';
import { SYNC_DIRECTIONS } from 'shared/constants';
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
        status: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        reason: Sequelize.STRING,
        injectionSite: Sequelize.STRING, // conceptually enum(INJECTION_SITE_OPTIONS)
        givenBy: Sequelize.TEXT,
        date: dateTimeType('date', {
          allowNull: false,
        }),
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
  }

  static buildSyncFilter(patientIds) {
    const whereOrs = [];

    if (patientIds.length > 0) {
      whereOrs.push(`
        encounters.patient_id IN ($patientIds)
      `);
    }

    // add any administered vaccines with a vaccine in the list of scheduled vaccines that sync everywhere
    const vaccinesToSync = config.sync.syncAllEncountersForTheseVaccines;
    if (vaccinesToSync?.length > 0) {
      const escapedVaccineIds = vaccinesToSync.map(id => this.sequelize.escape(id)).join(',');
      whereOrs.push(`
        scheduled_vaccine_id IN (
          SELECT DISTINCT(scheduled_vaccines.id)
          FROM scheduled_vaccines
          WHERE scheduled_vaccines.vaccine_id IN (${escapedVaccineIds})
        )
      `);
    }

    if (whereOrs.length === 0) {
      return null;
    }

    return `
      JOIN encounters ON administered_vaccines.encounter_id = encounters.id
      WHERE
      ${whereOrs.join('\nOR')}
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
