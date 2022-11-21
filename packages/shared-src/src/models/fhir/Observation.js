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

  async pushUpstream() {
    // Take a FhirResource and save it into Tamanu
  }
}
