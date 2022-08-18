import { Sequelize, Op } from 'sequelize';
import { InvalidOperationError } from 'shared/errors';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';
import { Encounter } from './Encounter';
import { ScheduledVaccine } from './ScheduledVaccine';

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
        date: {
          type: Sequelize.DATE,
          allowNull: false,
        },
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
