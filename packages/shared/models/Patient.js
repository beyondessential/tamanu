import { Sequelize, Model } from 'sequelize';

export class Patient extends Model {

  static init(options, models) {
    super.init({
      id: {
        type: Sequelize.UUIDV4,
        primaryKey: true,
      },
      displayId: Sequelize.STRING,

      firstName: Sequelize.STRING,
      middleName: Sequelize.STRING,
      lastName: Sequelize.STRING,
      culturalName: Sequelize.STRING,

      dateOfBirth: Sequelize.DATE,
      sex: Sequelize.ENUM('male', 'female', 'other'),
    }, options);
  }

  static initRelations(models) {
    this.hasMany(models.Visit);
  }

}
