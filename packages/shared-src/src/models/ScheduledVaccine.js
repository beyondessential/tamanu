import { Sequelize } from 'sequelize';

import { Model } from './Model';

// TODO: work out how to merge this with the Immunisation model
export class ScheduledVaccine extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        category: Sequelize.STRING,
        label: Sequelize.STRING,
        schedule: Sequelize.STRING,
      },
      options,
    );
  }

  static getListReferenceAssociations() {
    return ['vaccine'];
  }

  static initRelations(models) {
    // TODO: what reference data type is a vaccine? drug or something else?
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'vaccineId',
      as: 'vaccine',
    });
  }
}
