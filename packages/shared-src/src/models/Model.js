import * as sequelize from 'sequelize';
import { SyncConfig } from './sync';

const { Sequelize, Op, Utils } = sequelize;

const firstLetterLowercase = s => (s[0] || '').toLowerCase() + s.slice(1);

// write a migration when adding to this list (e.g. 005_markedForPush.js and 007_pushedAt.js)
const MARKED_FOR_PUSH_MODELS = [
  'Encounter',
  'LabRequestLog',
  'Patient',
  'PatientAdditionalData',
  'PatientAllergy',
  'PatientCarePlan',
  'PatientCondition',
  'PatientFamilyHistory',
  'PatientIssue',
  'PatientSecondaryId',
  'ReportRequest',
  'ReportDefinition',
  'ReportDefinitionVersion',
  'UserFacility',
  'DocumentMetadata',
  'CertificateNotification',
  'PatientDeathData',
  'PatientBirthData',
  'ContributingDeathCause',
  'ImagingRequestAreas',
];

export class Model extends sequelize.Model {
  static init(originalAttributes, { syncClientMode, syncConfig, ...options }) {
    const attributes = { ...originalAttributes };
    if (syncClientMode && MARKED_FOR_PUSH_MODELS.includes(this.name)) {
      attributes.markedForPush = {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      };
      attributes.isPushing = {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      };
      attributes.deletedAt = Sequelize.DATE;
      attributes.pushedAt = Sequelize.DATE;
      attributes.pulledAt = Sequelize.DATE;
    }
    attributes.deletedAt = Sequelize.DATE;
    super.init(attributes, options);
    this.syncClientMode = syncClientMode;
    this.defaultIdValue = attributes.id.defaultValue;
    this.syncConfig = new SyncConfig(this, syncConfig);
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

    const { models } = this.sequelize;
    const values = Object.entries(this.dataValues)
      .filter(([_key, val]) => val !== null) // eslint-disable-line no-unused-vars
      .reduce(
        (obj, [key, val]) => ({
          ...obj,
          [key]: val,
        }),
        {},
      );

    const references = this.constructor.getListReferenceAssociations(models);

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
    const { models } = this.sequelize;
    return this.getListReferenceAssociations(models);
  }

  static async findByIds(ids, paranoid = true) {
    if (ids.length === 0) return [];

    return this.findAll({
      where: {
        id: { [Op.in]: ids },
      },
      paranoid,
    });
  }

  // list of callbacks to call after model is initialised
  static afterInitCallbacks = [];

  // adds a function to be called once model is initialised
  // (useful for hooks and anything else that needs an initialised model)
  static afterInit(fn) {
    this.afterInitCallbacks.push(fn);
  }

  static syncConfig = {};
}
