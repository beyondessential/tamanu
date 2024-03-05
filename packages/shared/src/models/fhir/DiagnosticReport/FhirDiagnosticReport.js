import { DataTypes, Sequelize } from 'sequelize';
import * as yup from 'yup';

import {
  FHIR_DIAGNOSTIC_REPORT_STATUS,
  FHIR_INTERACTIONS,
  LAB_REQUEST_STATUSES,
} from '@tamanu/constants';
import { FhirCodeableConcept, FhirReference } from '../../../services/fhirTypes';
import { FhirResource } from '../Resource';
import { fromLabTests } from './getQueryToFindUpstreamIds';
import { getQueryOptions } from './getQueryOptions';
import { getValues } from './getValues';

export class FhirDiagnosticReport extends FhirResource {
  static init(options, models) {
    super.init(
      {
        extension: DataTypes.JSONB, // This field is part of DomainResource
        identifier: DataTypes.JSONB,
        basedOn: DataTypes.JSONB,
        status: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        code: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        subject: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        effectiveDateTime: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        issued: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        performer: DataTypes.JSONB,
        result: DataTypes.JSONB,
      },
      options,
    );

    this.UpstreamModels = [models.LabTest];
    this.upstreams = [
      models.LabTest,
      models.LabRequest,
      models.LabTestType,
      models.ReferenceData,
      models.Encounter,
      models.Patient,
      models.User,
    ];
  }

  static CAN_DO = new Set([
    FHIR_INTERACTIONS.INSTANCE.READ,
    FHIR_INTERACTIONS.TYPE.SEARCH,
    FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
    FHIR_INTERACTIONS.TYPE.CREATE,
  ]);

  static get INTAKE_SCHEMA() {
    return yup.object({
      basedOn: FhirReference.asYup(),
      status: yup.string().required(),
      code: FhirCodeableConcept.asYup().required(),
    });
  }

  // This is beginning very modestly - can extend to handle full 
  // results soon.
  async pushUpstream() {
    console.log('Pushing upstream');
    const { FhirServiceRequest, LabRequest } = this.sequelize.models;

    const { type, reference } = this.basedOn;

    const ref = reference.split('/');
    if (type !== 'ServiceRequest' || ref.length < 2 || ref[0] !== 'ServiceRequest') {
      throw new Invalid(`DiagnosticReport must be results for ServiceRequest'`, {
        code: FHIR_ISSUE_TYPE.INVALID.VALUE,
      });
    }
    const serviceRequestFhirId = ref[1];

    const serviceRequest = await FhirServiceRequest.findByPk(serviceRequestFhirId);
    console.log({ serviceRequestFhirId });

    if (!serviceRequest) {
      throw new Invalid(`ServiceRequest ${failedId} does not exist in Tamanu`, {
        code: FHIR_ISSUE_TYPE.INVALID.VALUE,
      });
    }
    let upstreamRequest;
    if (serviceRequestId) {
      upstreamRequest = await ImagingRequest.findByPk(serviceRequestId);
    } else if (serviceRequestDisplayId) {
      upstreamRequest = await ImagingRequest.findOne({
        where: { displayId: serviceRequestDisplayId },
      });
    }

    if (this.status !== 'final') {
      throw new Invalid(`ImagingStudy status must be 'final'`, {
        code: FHIR_ISSUE_TYPE.INVALID.VALUE,
      });
    }

    const labRequest = await LabRequest.findByPk(serviceRequest.upstreamId);
    if (!labRequest) {
      // this is only a possibility when using a FHIR basedOn reference
      throw new Deleted(`LabRequest ${serviceRequest.upstreamId} has been deleted in Tamanu`);
    }

    console.log({ newStatus: labRequest.getLabRequestStatus() });
    labRequest.set({ status: this.getLabRequestStatus() });
    await labRequest.save();

    return result;
  }

  async updateMaterialisation() {
    const upstream = await this.getUpstream(getQueryOptions(this.sequelize.models));
    const values = await getValues(upstream, this.sequelize.models);
    this.set(values);
  }

  static async queryToFindUpstreamIdsFromTable(upstreamTable, table, id) {
    const { LabTest } = this.sequelize.models;

    if (upstreamTable === LabTest.tableName) {
      return fromLabTests(this.sequelize.models, table, id);
    }
    return null;
  }

  getLabRequestStatus() {
    switch (this.status) {
      case FHIR_DIAGNOSTIC_REPORT_STATUS.REGISTERED:
      case FHIR_DIAGNOSTIC_REPORT_STATUS.PARTIAL._:
        return LAB_REQUEST_STATUSES.TO_BE_VERIFIED;
      case FHIR_DIAGNOSTIC_REPORT_STATUS.PARTIAL.PRELIMINARY:
        return LAB_REQUEST_STATUSES.VERIFIED;
      case FHIR_DIAGNOSTIC_REPORT_STATUS.FINAL:
        return LAB_REQUEST_STATUSES.PUBLISHED;
      case FHIR_DIAGNOSTIC_REPORT_STATUS.CANCELLED:
        return LAB_REQUEST_STATUSES.CANCELLED;
      case FHIR_DIAGNOSTIC_REPORT_STATUS.ENTERED_IN_ERROR:
        return LAB_REQUEST_STATUSES.ENTERED_IN_ERROR;
      case FHIR_DIAGNOSTIC_REPORT_STATUS.AMENDED._:
      case FHIR_DIAGNOSTIC_REPORT_STATUS.AMENDED.CORRECTED:
      case FHIR_DIAGNOSTIC_REPORT_STATUS.AMENDED.APPENDED:
        // no workflow for these yet
        throw new Invalid('No workflow to amend LabRequests via DiagnosticReports');
      default:
        return null;
    }
  }
}
