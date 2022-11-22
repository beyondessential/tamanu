import { DataTypes } from 'sequelize';
import { FhirResource } from './Resource';
import { arrayOf } from './utils';
import { FhirAnnotation, FhirIdentifier, FhirReference } from '../../services/fhirTypes';

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

  static INTAKE_SCHEMA = yup.object({});

  async pushUpstream() {
    // Take a FhirResource and save it into Tamanu
  }
}

/*
The plan:
- in the server, a POST route (named after create FHIR op) per resource
  - filtered on which have an INTAKE_SCHEMA
- the route takes a JSON body and validates it against the schema
- also check headers and such as per spec
- if valid, create the corresponding FhirResource from it (*in memory*)
  - call pushUpstream on it, that returns an instance of the UpstreamModel
  - if the resource has an UpstreamModel defined:
    - queue it for materialisation
    - include in the materialisation request the ID of the incoming, if present
- return status and body as per spec
*/
