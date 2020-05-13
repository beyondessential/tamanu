import * as sequelize from 'sequelize';

export const Sequelize = sequelize.Sequelize;

export class Model extends sequelize.Model {
  forResponse() {
    return this.dataValues;
  }

  toJSON() {
    return this.forResponse();
  }

  getModelName() {
    return this.constructor.name;
  }

  getNotes(limit = undefined) {
    const { Note } = this.sequelize.models;
    return Note.findAll({
      where: {
        objectType: this.getModelName(),
        objectId: this.id,
      },
      limit,
    });
  }

  static getReferenceAssociations() {
    return undefined;
  }
}
