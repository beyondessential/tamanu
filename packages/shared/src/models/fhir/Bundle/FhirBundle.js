import { DataTypes, Sequelize } from 'sequelize';
import * as yup from 'yup';

import {
  FHIR_DIAGNOSTIC_REPORT_STATUS,
  FHIR_INTERACTIONS,
  FHIR_ISSUE_TYPE,
  LAB_REQUEST_STATUSES,
  SUPPORTED_CONTENT_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
} from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/shared/errors';
import { FhirCodeableConcept, FhirReference } from '../../../services/fhirTypes';
import { FhirResource } from '../Resource';
import { Invalid } from '../../../utils/fhir';

export class FhirDiagnosticReport extends FhirResource {
  static init(options, models) {
    super.init(
      {
        basedOn: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        status: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        code: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        presentedForm: {
          type: DataTypes.JSONB,
        }
      },
      options,
    );

    this.UpstreamModels = [models.LabTest];
    this.upstreams = [
      models.LabTest,
      models.LabRequest,
      models.LabTestType,
      models.LabRequestAttachment,
    ];
  }

  static CAN_DO = new Set([FHIR_INTERACTIONS.TYPE.CREATE]);

  static get INTAKE_SCHEMA() {
    return yup.object({
      basedOn: yup.array().of(FhirReference.asYup()).required(),
      status: yup.string().required(),
      code: FhirCodeableConcept.asYup().required(),
      presentedForm: yup.array().of(
        yup.object({
          data: yup.string().required(),
          title: yup.string().required(),
          contentType: yup.string().required(),
        }),
      ),
    });
  }




  // This is beginning very modestly - can extend to handle full 
  // results soon.
  async pushUpstream({ requesterId }) {
    const { FhirServiceRequest, LabRequest } = this.sequelize.models;
    if (!this.basedOn || !Array.isArray(this.basedOn)) {
      throw new Invalid('DiagnosticReport requires basedOn to report results for ServiceRequest', {
        code: FHIR_ISSUE_TYPE.INVALID.VALUE,
      });
    }
    const { type, reference } = this.basedOn[0];

    const ref = reference.split('/');
    if (type !== 'ServiceRequest' || ref.length < 2 || ref[0] !== 'ServiceRequest') {
      throw new Invalid(`DiagnosticReport requires must be results for ServiceRequest'`, {
        code: FHIR_ISSUE_TYPE.INVALID.VALUE,
      });
    }
    const serviceRequestFhirId = ref[1];

    const serviceRequest = await FhirServiceRequest.findOne({ where: { id: serviceRequestFhirId } });

    if (!serviceRequest) {
      throw new Invalid(`ServiceRequest '${serviceRequestFhirId}' does not exist in Tamanu`, {
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
      throw new Invalid(`No LabRequest with id: '${serviceRequest.upstreamId}', might be ImagingRequest id`);
    }
    await this.sequelize.transaction(async () => {
      const newStatus = this.getLabRequestStatus();
      if (labRequest.status && labRequest.status !== newStatus) {
        labRequest.set({ status: newStatus });
        await labRequest.save();

        if (!requesterId) throw new InvalidOperationError('No user found for LabRequest status change.');
        await this.sequelize.models.LabRequestLog.create({
          status: newStatus,
          labRequestId: labRequest.id,
          updatedById: requesterId,
        });
      }
    });

    if (this.presentedForm) {
      await this.saveAttachment(labRequest);
    }
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
        throw new Invalid('Amend workflow unsupported');
      default:
        throw new Invalid(`'${this.status}' is an invalid ServiceRequest status`);
    }
  }

  async saveAttachment(labRequest) {
    if (!Array.isArray(this.presentedForm) || this.presentedForm.length > 1) {
      throw new Invalid('presentedForm must be an array on length 1');
    }

    const form = this.presentedForm[0];
    if (!Object.values(SUPPORTED_CONTENT_TYPES).includes(form.contentType)) {
      throw new Invalid(`presentedForm must be one of the supported values: ${Object.values(SUPPORTED_CONTENT_TYPES)}`);
    }
    if (form.data.length > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new Invalid(`Maximum length of for attachment is ${MAX_ATTACHMENT_SIZE_BYTES / 1024}k characters`);
    }
    const { Attachment, LabRequestAttachment } = this.sequelize.models;
    const { data, type } = Attachment.sanitizeForDatabase({
      data: form.data,
      type: form.contentType,
    })
    const attachment = await Attachment.create({ data, type });
    const lastAttachment = await labRequest.getLatestAttachment();
    const labRequestAttachment = await LabRequestAttachment.create({
      attachmentId: attachment.id,
      title: form.title,
      labRequestId: labRequest.id,
      isVisible: true,
    });

    if (lastAttachment) {
      lastAttachment.set({ replacedById: labRequestAttachment.id });
      await lastAttachment.save();
    }
  }
}
