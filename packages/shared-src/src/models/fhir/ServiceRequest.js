import { Sequelize, DataTypes } from 'sequelize';
import { FhirResource } from './Resource';
import { arrayOf } from './utils';
import { dateTimeType } from '../dateTimeTypes';

export class FhirServiceRequest extends FhirResource {
  static init(options) {
    super.init(
      {
        identifier: arrayOf('identifier', DataTypes.FHIR_IDENTIFIER),
        status: {
          type: Sequelize.STRING(16),
          allowNull: false,
        },
        intent: {
          type: Sequelize.STRING(16),
          allowNull: false,
        },
        category: arrayOf('category', DataTypes.FHIR_CODEABLE_CONCEPT),
        priority: {
          type: Sequelize.STRING(10),
          allowNull: true,
        },
        orderDetail: arrayOf('orderDetail', DataTypes.FHIR_CODEABLE_CONCEPT),
        occurrenceDateTime: {
          ...dateTimeType('occurrenceDateTime'),
          allowNull: true,
        },
        locationCode: arrayOf('locationCode', DataTypes.FHIR_CODEABLE_CONCEPT),
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
