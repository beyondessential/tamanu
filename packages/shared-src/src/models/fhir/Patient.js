import { Sequelize, DataTypes } from 'sequelize';
import { FhirResource } from './Resource';
import { dateType } from '../dateTimeTypes';

export class FhirPatient extends FhirResource {
  static init(options) {
    super.init(
      {
        identifier: this.ArrayOf('identifier', DataTypes.FHIR_IDENTIFIER),
        active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        name: this.ArrayOf('name', DataTypes.FHIR_HUMAN_NAME),
        telecom: this.ArrayOf('telecom', DataTypes.FHIR_CONTACT_POINT),
        gender: {
          type: Sequelize.STRING(10),
          allowNull: false,
        },
        birthDate: {
          ...dateType('birthDate'),
          allowNull: true,
        },
        deceasedDateTime: {
          ...dateType('deceasedDateTime'),
          allowNull: true,
        },
        address: this.ArrayOf('address', DataTypes.FHIR_ADDRESS),
      },
      options,
    );
  }

  static initRelations(models) {}
}
