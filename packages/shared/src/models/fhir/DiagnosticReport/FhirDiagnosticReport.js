import { DataTypes, Sequelize } from 'sequelize';
import * as yup from 'yup';

import {
  FHIR_DIAGNOSTIC_REPORT_STATUS,
  FHIR_INTERACTIONS,
  LAB_REQUEST_STATUSES,
} from '@tamanu/constants';
import { FhirCodeableConcept, FhirReference } from '../../../services/fhirTypes';
import { FhirResource } from '../Resource';

export class FhirDiagnosticReport extends FhirResource {
  static init(options, models) {
    super.init(
      {
        basedOn: DataTypes.JSONB,
        status: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        code: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
      },
      options,
    );

    this.UpstreamModels = [models.LabTest];
    this.upstreams = [
      models.LabTest,
      models.LabRequest,
      models.LabTestType,
    ];
  }

  static CAN_DO = new Set([FHIR_INTERACTIONS.TYPE.CREATE]);

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
    console.log('buildin12g');
    const { FhirServiceRequest, LabRequest } = this.sequelize.models;

    const { type, reference } = this.basedOn;

    const ref = reference.split('/');
    if (type !== 'ServiceRequest' || ref.length < 2 || ref[0] !== 'ServiceRequest') {
      throw new Invalid(`DiagnosticReport must be results for ServiceRequest'`, {
        code: FHIR_ISSUE_TYPE.INVALID.VALUE,
      });
    }
    const serviceRequestFhirId = ref[1];

    const serviceRequest = await FhirServiceRequest.findOne({ where: { id: serviceRequestFhirId } });

    if (!serviceRequest) {
      throw new Invalid(`ServiceRequest ${serviceRequestFhirId} does not exist in Tamanu`, {
        code: FHIR_ISSUE_TYPE.INVALID.VALUE,
      });
    }
    if (!this.getLabRequestStatus()) {
      throw new Invalid(`LabRequest status invalid`, {
        code: FHIR_ISSUE_TYPE.INVALID.VALUE,
      });
    }

    const labRequest = await LabRequest.findByPk(serviceRequest.upstreamId);
    if (!labRequest) {
      // this is only a possibility when using a FHIR basedOn reference
      throw new Deleted(`LabRequest ${serviceRequest.upstreamId} has been deleted in Tamanu`);
    }

    labRequest.set({ status: this.getLabRequestStatus() });
    await labRequest.save();
    return labRequest;
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
