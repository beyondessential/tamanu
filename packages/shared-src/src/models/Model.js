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

  static getListReferenceAssociations() {
    // List of relations to include when fetching this model
    // as part of a list (eg to display in a table)
    //
    // This will get used in an options object passed to a sequelize
    // query, so returning 'undefined' by default here just leaves that key
    // empty (which is the desired behaviour).
    return undefined;
  }

  static getFullReferenceAssociations() {
    // List of relations when fetching just this model
    // (eg to display in a detailed view)
    return this.getListReferenceAssociations();
  }
}
