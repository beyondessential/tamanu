import { DataTypes } from 'sequelize';
import * as yup from 'yup';

import { FhirResource } from './Resource';
import { arrayOf } from './utils';

import { FhirAnnotation, FhirIdentifier, FhirReference } from '../../services/fhirTypes';
import { FHIR_INTERACTIONS, FHIR_ISSUE_TYPE } from '../../constants';
import { Deleted, Invalid } from '../../utils/fhir';

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

  static CAN_DO = new Set([FHIR_INTERACTIONS.TYPE.CREATE]);

  static INTAKE_SCHEMA = yup.object({
    identifier: yup.array().of(FhirIdentifier.asYup()),
    basedOn: yup.array().of(FhirReference.asYup()),
    status: yup.string().required(),
    note: yup.array().of(FhirAnnotation.asYup()),
  });

  async pushUpstream() {
    const { FhirServiceRequest, ImagingRequest } = this.constructor.models;

    const results = this.note.map(n => n.text).join('\n\n');

    const imagingAccessCode = this.identifier.find(
      i => i?.system === 'http://data-dictionary.tamanu-fiji.org/ris-accession-number.html',
    )?.value;
    if (!imagingAccessCode) {
      throw new Invalid('Need to have RIS Accession Number identifier', {
        code: FHIR_ISSUE_TYPE.INVALID.STRUCTURE,
      });
    }

    const serviceRequestFhirId = this.basedOn.find(
      b =>
        b?.type === 'ServiceRequest' &&
        b?.identifier?.system ===
          'http://data-dictionary.tamanu-fiji.org/tamanu-mrid-imagingrequest.html',
    )?.identifier.value;
    if (!serviceRequestFhirId) {
      throw new Invalid('Need to have basedOn field that includes a Tamanu identifier', {
        code: FHIR_ISSUE_TYPE.INVALID.STRUCTURE,
      });
    }

    const serviceRequest = await FhirServiceRequest.findByPk(serviceRequestFhirId);
    if (!serviceRequest) {
      throw new Invalid(`ServiceRequest ${serviceRequestFhirId} does not exist in Tamanu`, {
        code: FHIR_ISSUE_TYPE.INVALID.VALUE,
      });
    }

    if (this.status !== 'final') {
      throw new Invalid(`Observation status must be 'final'`, {
        code: FHIR_ISSUE_TYPE.INVALID.VALUE,
      });
    }

    const imagingRequest = await ImagingRequest.findByPk(serviceRequest.upstreamId);
    if (!imagingRequest) {
      throw new Deleted('ImagingRequest has been deleted in Tamanu');
    }

    imagingRequest.set({ results, externalResultsCode: imagingAccessCode });
    await imagingRequest.save();

    return imagingRequest;
  }
}
