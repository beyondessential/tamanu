import { Sequelize, DataTypes } from 'sequelize';
import { FhirResource } from './Resource';
import { dateTimeType } from '../dateTimeTypes';

export class FhirServiceRequest extends FhirResource {
  static init(options) {
    super.init(
      {
        identifier: this.ArrayOf('identifier', DataTypes.FHIR_IDENTIFIER),
        status: {
          type: Sequelize.STRING(16),
          allowNull: false,
        },
        intent: {
          type: Sequelize.STRING(16),
          allowNull: false,
        },
        category: this.ArrayOf('category', DataTypes.FHIR_CODEABLE_CONCEPT),
        priority: {
          type: Sequelize.STRING(10),
          allowNull: true,
        },
        orderDetail: this.ArrayOf('orderDetail', DataTypes.FHIR_CODEABLE_CONCEPT),
        occurrenceDateTime: {
          ...dateTimeType('occurrenceDateTime'),
          allowNull: true,
        },
        locationCode: this.ArrayOf('locationCode', DataTypes.FHIR_CODEABLE_CONCEPT),
      },
      options,
    );
  }

  static initRelations(models) {
    this.belongsTo(models.FhirPatient, {
      foreignKey: 'subject',
      as: 'subjectPatient',
    });
    this.belongsTo(models.FhirPractitioner, {
      foreignKey: 'requester',
      as: 'requesterPractitioner',
    });
  }
}
