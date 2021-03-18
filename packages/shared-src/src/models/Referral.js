"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Referral = void 0;

var _sequelize = require("sequelize");

var _errors = require("shared/errors");

var _Model = require("./Model");

class Referral extends _Model.Model {
  static init({
    primaryKey,
    ...options
  }) {
    super.init({
      id: primaryKey,
      referredFacility: _sequelize.Sequelize.STRING,
    }, { ...options,
      validate: {
        mustHaveValidEncounter() {
          if (!this.patientId) {
            throw new _errors.InvalidOperationError('A referral must have an initiating encounter');
          }
        },
      }
    });
  }

  static getListReferenceAssociations() {
    return ['initiatingEncounter', 'completingEncounter', 'surveyResponse'];
  }

  static initRelations(models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'initiatingEncounter'
    });
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'completingEncounter'
    });
    this.belongsTo(models.Encounter, {
      foreignKey: 'surveyResponseId',
      as: 'surveyResponse'
    });
  }

}

exports.Referral = Referral;