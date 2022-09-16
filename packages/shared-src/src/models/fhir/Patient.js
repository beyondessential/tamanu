import { Sequelize, DataTypes } from 'sequelize';
import { FhirResource } from './Resource';
import { dateType } from '../dateTimeTypes';

export class FhirPatient extends FhirResource {
  static init(options) {
    super.init({
      identifier: {
        type: Sequelize.ARRAY(DataTypes.FHIR_IDENTIFIER),
        allowNull: false,
        defaultValue: [],
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      // name: {
      //   type: 'fhir.human_name[]',
      //   allowNull: false,
      //   defaultValue: '{}',
      // },
      // telecom: {
      //   type: 'fhir.contact_point[]',
      //   allowNull: false,
      //   defaultValue: '{}',
      // },
      gender: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      birthDate: {
        type: dateType('birthDate'),
        allowNull: true,
      },
      deceasedDateTime: {
        type: dateType('deceasedDateTime'),
        allowNull: true,
      },
      // address: {
      //   type: 'fhir.address[]',
      //   allowNull: false,
      //   defaultValue: '{}',
      // },
    }, options);
  }

  static initRelations(models) {}
}
