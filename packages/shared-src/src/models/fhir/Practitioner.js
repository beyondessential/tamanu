import { Sequelize, DataTypes } from 'sequelize';
import { FhirResource } from './Resource';
import { arrayOf } from './utils';

export class FhirPractitioner extends FhirResource {
  static init(options) {
    super.init(
      {
        identifier: arrayOf('identifier', DataTypes.FHIR_IDENTIFIER),
        active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
        },
        name: arrayOf('name', DataTypes.FHIR_HUMAN_NAME),
        telecom: arrayOf('telecom', DataTypes.FHIR_CONTACT_POINT),
      },
      options,
    );
  }

  static initRelations(models) {
    this.hasMany(models.FhirServiceRequest, {
      foreignKey: 'requester',
      as: 'requestedServiceRequests',
    });
  }
}
