import { Sequelize, DataTypes } from 'sequelize';

import { FhirResource } from './Resource';
import { dateType } from '../dateTimeTypes';

export class FhirImmunization extends FhirResource {
  static init(options, models) {
    super.init(
      {
        identifier: this.ArrayOf('identifier', DataTypes.FHIR_IDENTIFIER),
        status: {
          type: Sequelize.STRING(16),
          allowNull: false,
        },
        vaccineCode: this.ArrayOf('vaccineCode', DataTypes.FHIR_CODEABLE_CONCEPT),
        occurenceDateTime: dateType('occuranceDateTime', { allowNull: true }),
        lotNumber: Sequelize.TEXT,
        site: this.ArrayOf('site', DataTypes.FHIR_CODEABLE_CONCEPT),
        performer: {}, // TODO: figure out field?
        protocolApplied: {}, // TODO: ditto
      },
      options,
    );

    this.UpstreamModel = models.AdministeredVaccine;
  }

  static initRelations(models) {
    this.belongsTo(models.FhirPatient, {
      foreignKey: 'patient',
    });

    this.belongsTo(models.Encounter, {
      foreignKey: 'encounter',
    });
  }

  // TODO: add fields and check if any other models are missing from include (hint: yes)
  async updateMaterialisation() {
    const { ScheduledVaccine } = this.sequelize.models;

    const upstream = await this.getUpstream({
      include: [
        {
          model: ScheduledVaccine,
          as: 'scheduledVaccine',
        },
      ],
    });

    this.set({});
  }
}
