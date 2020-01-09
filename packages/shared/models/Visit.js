import { Sequelize, Model } from 'sequelize';

export class Visit extends Model {

  static init(options) {
    super.init({
      id: { type: Sequelize.UUIDV4, primaryKey: true },
      type: Sequelize.ENUM('clinic', 'emergency', 'lab'),
    }, options); 
  }

  static initRelations(models) {
    this.belongsTo(models.Patient);
  }

}
