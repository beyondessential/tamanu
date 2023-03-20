import config from 'config';
import { DataTypes } from 'sequelize';
import * as yup from 'yup';

import { FhirResource } from './Resource';
import { arrayOf } from './utils';

import { FhirAnnotation, FhirIdentifier, FhirReference } from '../../services/fhirTypes';
import { FHIR_INTERACTIONS, FHIR_ISSUE_TYPE, IMAGING_REQUEST_STATUS_TYPES } from '../../constants';
import { Deleted, Invalid } from '../../utils/fhir';
import { getCurrentDateTimeString, toDateTimeString } from '../../utils/dateTime';

export class FhirImagingStudy extends FhirResource {
  static init(options, models) {
    super.init(
      {
        identifier: arrayOf('identifier', DataTypes.FHIR_IDENTIFIER),
        basedOn: arrayOf('basedOn', DataTypes.FHIR_REFERENCE),
        started: DataTypes.DATE,
        status: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        note: arrayOf('note', DataTypes.FHIR_ANNOTATION),
      },
      options,
    );

    // it's not materialised yet. TBD in EPI-224
    this.UpstreamModel = models.ImagingResult;
  }

  static CAN_DO = new Set([FHIR_INTERACTIONS.TYPE.CREATE]);

  static get INTAKE_SCHEMA() {
    return yup.object({
      identifier: yup.array().of(FhirIdentifier.asYup()),
      basedOn: yup.array().of(FhirReference.asYup()),
      started: yup.date().optional(),
      status: yup.string().required(),
      note: yup.array().of(FhirAnnotation.asYup()),
    });
  }

  // This is currently very hardcoded for Aspen's use case.
  // We'll need to make it more generic at some point, but not today!
  async pushUpstream() {
    const { FhirServiceRequest, ImagingRequest, ImagingResult } = this.sequelize.models;

    const results = this.note.map(n => n.params.text).join('\n\n');

    const imagingAccessCode = this.identifier.find(
      ({ params: i }) => i?.system === config.hl7.dataDictionaries.imagingStudyAccessionId,
    )?.params.value;
    if (!imagingAccessCode) {
      throw new Invalid('Need to have Accession Number identifier', {
        code: FHIR_ISSUE_TYPE.INVALID.STRUCTURE,
      });
    }

    const serviceRequestFhirId = this.basedOn
      .map(ref => ref.fhirTypeAndId())
      .filter(Boolean)
      .find(({ type }) => type === 'ServiceRequest')?.id;
    const serviceRequestId = this.basedOn.find(
      ({ params: b }) =>
        b?.type === 'ServiceRequest' &&
        b?.identifier?.params.system === config.hl7.dataDictionaries.serviceRequestId,
    )?.params.identifier.params.value;
    const serviceRequestDisplayId = this.basedOn.find(
      ({ params: b }) =>
        b?.type === 'ServiceRequest' &&
        b?.identifier?.params.system === config.hl7.dataDictionaries.serviceRequestDisplayId,
    )?.params.identifier.params.value;

    let serviceRequest;
    if (serviceRequestFhirId) {
      serviceRequest = await FhirServiceRequest.findByPk(serviceRequestFhirId);
      if (!serviceRequest) {
        throw new Invalid(`ServiceRequest ${serviceRequestFhirId} does not exist in Tamanu`, {
          code: FHIR_ISSUE_TYPE.INVALID.VALUE,
        });
      }
    } else if (serviceRequestId) {
      const upstreamRequest = await ImagingRequest.findByPk(serviceRequestId);
      if (!upstreamRequest) {
        throw new Invalid(`ServiceRequest ${serviceRequestId} does not exist in Tamanu`, {
          code: FHIR_ISSUE_TYPE.INVALID.VALUE,
        });
      }
      serviceRequest = await FhirServiceRequest.findOne({
        where: { upstreamId: upstreamRequest.id },
      });
      if (!serviceRequest) {
        throw new Invalid(`ServiceRequest ${serviceRequestId} does not exist in Tamanu`, {
          code: FHIR_ISSUE_TYPE.INVALID.VALUE,
        });
      }
    } else if (serviceRequestDisplayId) {
      const upstreamRequest = await ImagingRequest.findOne({
        where: { displayId: serviceRequestDisplayId },
      });
      if (!upstreamRequest) {
        throw new Invalid(`ServiceRequest ${serviceRequestDisplayId} does not exist in Tamanu`, {
          code: FHIR_ISSUE_TYPE.INVALID.VALUE,
        });
      }
      serviceRequest = await FhirServiceRequest.findOne({
        where: { upstreamId: upstreamRequest.id },
      });
      if (!serviceRequest) {
        throw new Invalid(`ServiceRequest ${serviceRequestId} does not exist in Tamanu`, {
          code: FHIR_ISSUE_TYPE.INVALID.VALUE,
        });
      }
    }

    if (!serviceRequest) {
      throw new Invalid('Need to have basedOn field that includes a Tamanu identifier', {
        code: FHIR_ISSUE_TYPE.INVALID.STRUCTURE,
      });
    }

    if (this.status !== 'final') {
      throw new Invalid(`ImagingStudy status must be 'final'`, {
        code: FHIR_ISSUE_TYPE.INVALID.VALUE,
      });
    }

    const imagingRequest = await ImagingRequest.findByPk(serviceRequest.upstreamId);
    if (!imagingRequest) {
      // this is only a possibility when using a FHIR basedOn reference
      throw new Deleted('ImagingRequest has been deleted in Tamanu');
    }

    let result = await ImagingResult.findOne({
      where: {
        imagingRequestId: imagingRequest.id,
        externalCode: imagingAccessCode,
      },
    });
    if (result) {
      result.set({ description: results });
      await result.save();
    } else {
      result = await ImagingResult.create({
        imagingRequestId: imagingRequest.id,
        description: results,
        externalCode: imagingAccessCode,
        completedAt: this.started ? toDateTimeString(this.started) : getCurrentDateTimeString(),
      });
    }

    imagingRequest.set({ status: IMAGING_REQUEST_STATUS_TYPES.COMPLETED });
    await imagingRequest.save();

    return result;
  }
}
