import * as sequelize from 'sequelize';
import { lowerFirst } from 'lodash';
import { SYNC_DIRECTIONS } from 'shared/constants';

const { Sequelize, Op, Utils } = sequelize;

const firstLetterLowercase = s => (s[0] || '').toLowerCase() + s.slice(1);

// write a migration when adding to this list (e.g. 005_markedForPush.js and 007_pushedAt.js)
const MARKED_FOR_PUSH_MODELS = [
  'Encounter',
  'Patient',
  'PatientAllergy',
  'PatientCarePlan',
  'PatientCondition',
  'PatientFamilyHistory',
  'PatientIssue',
  'PatientAdditionalData',
  'ReportRequest',
  'UserFacility',
];

export class Model extends sequelize.Model {
  static init(originalAttributes, { syncClientMode, ...options }) {
    const attributes = { ...originalAttributes };
    if (syncClientMode && MARKED_FOR_PUSH_MODELS.includes(this.name)) {
      attributes.markedForPush = {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      };
      attributes.pushedAt = Sequelize.DATE;
      attributes.pulledAt = Sequelize.DATE;
    }
    super.init(attributes, options);
    this.syncClientMode = syncClientMode;
    this.defaultIdValue = attributes.id.defaultValue;
  }

  static generateId() {
    return Utils.toDefaultValue(this.defaultIdValue);
  }

  forResponse() {
    // Reassign reference associations to use camelCase & dataValues.
    // That is, it turns
    // { id: 12345, field: 'value', ReferenceObject: [model instance] }
    // into
    // { id: 12345, field: 'value', referenceObject: { id: 23456, name: 'object' } }

    const values = Object.entries(this.dataValues)
      .filter(([key, val]) => val !== null)
      .reduce(
        (obj, [key, val]) => ({
          ...obj,
          [key]: val,
        }),
        {},
      );

    const references = this.constructor.getListReferenceAssociations();

    if (!references) return values;

    // Note that we don't call forResponse on the nested object, this is under the assumption that
    // if the structure of a nested object differs significantly from its database representation,
    // it's probably more correct to implement that as a separate endpoint rather than putting the
    // logic here.
    return references.reduce((allValues, referenceName) => {
      const { [referenceName]: referenceVal, ...otherValues } = allValues;
      if (!referenceVal) return allValues;
      return { ...otherValues, [firstLetterLowercase(referenceName)]: referenceVal.dataValues };
    }, values);
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
        recordType: this.getModelName(),
        recordId: this.id,
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

  static includedSyncRelations = [];

  static excludedSyncColumns = ['createdAt', 'updatedAt', 'markedForPush', 'markedForSync'];

  // determines whether a mdoel will be pushed, pulled, both, or neither
  static syncDirection = SYNC_DIRECTIONS.DO_NOT_SYNC;

  // returns one or more channels to push to
  static getChannels() {
    return [lowerFirst(this.name)];
  }

  // extracts and returns a parentId from a channel, if applicable
  // only called if syncParentIdKey is set
  static syncParentIdFromChannel() {
    throw new Error('Models with syncParentIdKey must implement syncParentIdFromChannel');
  }

  // if set to a string representing a field, extracts an id from the channel and sets it on the model
  static syncParentIdKey = null;

  static async findByIds(ids) {
    return this.findAll({
      where: { id: { [Op.in]: ids } },
    });
  }
}
