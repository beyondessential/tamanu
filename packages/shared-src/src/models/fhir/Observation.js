import { DataTypes } from 'sequelize';
import * as yup from 'yup';

import { FhirResource } from './Resource';
import { arrayOf } from './utils';

import { FhirAnnotation, FhirIdentifier, FhirReference } from '../../services/fhirTypes';
import { FHIR_INTERACTIONS } from '../../constants';

export class FhirObservation extends FhirResource {
  static init(options) {
    super.init(
      {
        identifier: arrayOf('identifier', DataTypes.FHIR_IDENTIFIER),
        basedOn: arrayOf('basedOn', DataTypes.FHIR_REFERENCE),
        status: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        note: arrayOf('note', DataTypes.FHIR_ANNOTATION),
      },
      options,
    );

    // it's not materialised yet. TBD in EPI-224
    // this.UpstreamModel = models.Observation;
  }

  static CAN_DO = new Set([
    FHIR_INTERACTIONS.TYPE.CREATE,
  ]);

  static INTAKE_SCHEMA = yup.object({
    identifier: yup.array().of(FhirIdentifier.asYup()),
    basedOn: yup.array().of(FhirReference.asYup()),
    status: yup.string().required(),
    note: yup.array().of(FhirAnnotation.asYup()),
  });

  async pushUpstream() {
    // Take a FhirResource and save it into Tamanu
  }
}
