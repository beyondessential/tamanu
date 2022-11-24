import { DataTypes } from 'sequelize';
import { FhirResource } from './Resource';
import { arrayOf } from './utils';
import { FhirAnnotation, FhirIdentifier, FhirReference } from '../../services/fhirTypes';
import { FHIR_INTERACTIONS } from '../../constants';

export class FhirObservation extends FhirResource {
  static init(options) {
    super.init(
      {
        identifier: arrayOf(FhirIdentifier),
        basedOn: arrayOf(FhirReference),
        status: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        note: arrayOf(FhirAnnotation),
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

/*
The plan:
- in the server, a POST route (named after create FHIR op) per resource
- the route takes a JSON body and validates it against the schema
- also check headers and such as per spec
- if valid, create the corresponding FhirResource from it (*in memory*)
  - call pushUpstream on it, that returns an instance of the UpstreamModel
  - if the resource has an UpstreamModel defined:
    - queue it for materialisation
    - include in the materialisation request the ID of the incoming, if present
- return status and body as per spec
*/
