import { Sequelize } from 'sequelize';
import { Model } from './Model';
import { dateTimeType } from './dateTimeTypes';

export class Procedure extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        completed: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        date: dateTimeType('date', { allowNull: false }),
        endTime: dateTimeType('endTime'),
        startTime: dateTimeType('startTime'),
        note: Sequelize.STRING,
        completedNote: Sequelize.STRING,
      },
      options,
    );
  }

  static getListReferenceAssociations() {
    return ['Location', 'ProcedureType', 'Anaesthetic'];
  }

  static initRelations(models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
    });
    this.belongsTo(models.Location, {
      foreignKey: 'locationId',
      as: 'Location',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'procedureTypeId',
      as: 'ProcedureType',
    });
    this.belongsTo(models.User, {
      foreignKey: 'physicianId',
      as: 'Physician',
    });
    this.belongsTo(models.User, {
      foreignKey: 'assistantId',
      as: 'Assistant',
    });
    this.belongsTo(models.User, {
      foreignKey: 'anaesthetistId',
      as: 'Anaesthetist',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'anaestheticId',
      as: 'Anaesthetic',
    });
  }
}
