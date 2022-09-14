import { DataType } from 'sequelize';
import { FhirResource } from './Resource';
import { dateType } from '../dateTimeTypes';

export class FhirPatient extends FhirResource {
  static init() {
    super.init({
      identifier: {
        type: DataType.ARRAY(DataType.IDENTIFIER),
        allowNull: false,
        defaultValue: [],
      },
      active: {
        type: DataType.BOOLEAN,
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
        type: DataType.STRING(10),
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
    });
  }

  static initRelations(models) {}
}
