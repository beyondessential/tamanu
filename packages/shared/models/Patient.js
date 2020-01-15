import { Sequelize, Model } from './Model';

export class Patient extends Model {

  static init(options, models) {
    super.init({
      id: {
        type: Sequelize.UUID,
        defaultValue: options.createId,
        primaryKey: true,
      },
      displayId: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },

      firstName: Sequelize.STRING,
      middleName: Sequelize.STRING,
      lastName: Sequelize.STRING,
      culturalName: Sequelize.STRING,

      dateOfBirth: Sequelize.DATE,
      sex: {
        type: Sequelize.ENUM('male', 'female', 'other'),
        allowNull: false,
      },
    }, {
      ...options,
      indexes: [
        { fields: ['display_id'] },
        { fields: ['last_name'] },
      ]
    }); 
  }

  static initRelations(models) {
    this.hasMany(models.Visit);
  }

}
