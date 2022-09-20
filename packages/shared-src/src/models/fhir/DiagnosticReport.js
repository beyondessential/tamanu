import { Sequelize, DataTypes } from 'sequelize';

import { FhirResource } from './Resource';
import { dateType } from '../dateTimeTypes';

export class FhirDiagnosticReport extends FhirResource {
  static init(options, models) {
    super.init(
      {
        identifier: this.ArrayOf('identifier', DataTypes.FHIR_IDENTIFIER),
        status: {
          type: Sequelize.STRING(16),
          allowNull: false,
        },
        category: this.ArrayOf('category', DataTypes.FHIR_CODEABLE_CONCEPT),
        code: this.ArrayOf('code', DataTypes.FHIR_CODEABLE_CONCEPT),
        effectiveDateTime: dateType('effectiveDateTime', { allowNull: true }),
        issued: dateType('issued', { allowNull: true }),
        performer: {}, // TODO: figure out field?
        result: {}, // TODO: ditto
      },
      options,
    );

    this.UpstreamModel = models.LabTest;
  }

  static initRelations(models) {
    this.belongsTo(models.FhirPatient, {
      foreignKey: 'subject',
      as: 'subjectPatient',
    });
  }

  // TODO: add fields and check if any other models are missing from include (hint: yes)
  async updateMaterialisation() {
    const { LabRequest } = this.sequelize.models;

    const upstream = await this.getUpstream({
      include: [
        {
          model: LabRequest,
          as: 'labRequest',
        },
      ],
    });

    this.set({});
  }
}
