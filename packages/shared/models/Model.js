import * as sequelize from 'sequelize';

export const Sequelize = sequelize.Sequelize;

export class Model extends sequelize.Model {
  forResponse() {
    return this.dataValues;
  }

  toJSON() {
    return this.forResponse();
  }
}
