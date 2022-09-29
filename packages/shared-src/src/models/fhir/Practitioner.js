import { Sequelize, DataTypes } from 'sequelize';
import { FhirResource } from './Resource';

export class FhirPractitioner extends FhirResource {
  static init(options) {
    super.init(
      {
        identifier: this.ArrayOf('identifier', DataTypes.FHIR_IDENTIFIER),
        active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
        },
        name: this.ArrayOf('name', DataTypes.FHIR_HUMAN_NAME),
        telecom: this.ArrayOf('telecom', DataTypes.FHIR_CONTACT_POINT),
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
