import { Sequelize, Op } from 'sequelize';
import { InvalidOperationError } from 'shared/errors';
import { Model } from './Model';
import { Encounter } from './Encounter';
import { ScheduledVaccine } from './ScheduledVaccine';

export class AdministeredVaccine extends Model {
  static init({ primaryKey, ...options }) {
    options.validate = {
      mustHaveScheduledVaccine() {
        if (!this.deletedAt && !this.scheduledVaccineId) {
          throw new InvalidOperationError('An administered vaccine must have a scheduled vaccine.');
        }
      },
      mustHaveEncounter() {
        if (!this.deletedAt && !this.encounterId) {
          throw new InvalidOperationError('An administered vaccine must have an encounter.');
        }
      },
    };
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
        location: Sequelize.STRING,
        injectionSite: Sequelize.STRING, // conceptually enum(INJECTION_SITE_OPTIONS)
        date: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      },
      options,
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
  }

  static async lastVaccinationForPatient(patientId, vaccineLabels = []) {
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

    if (vaccineLabels.length) {
      query.where['$scheduledVaccine.label$'] = {
        [Op.in]: vaccineLabels
      };

      query.include.push({
        model: ScheduledVaccine,
        as: 'scheduledVaccine',
      });
    }

    return AdministeredVaccine.findOne(query);
  }
}
