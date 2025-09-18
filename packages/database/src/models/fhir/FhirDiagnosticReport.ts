import { DataTypes } from 'sequelize';
import * as yup from 'yup';

import {
  FHIR_DIAGNOSTIC_REPORT_STATUS,
  FHIR_INTERACTIONS,
  FHIR_ISSUE_TYPE,
  LAB_REQUEST_STATUSES,
  SUPPORTED_CONTENT_TYPES,
} from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { InvalidOperationError } from '@tamanu/errors';
import { FhirCodeableConcept, FhirReference } from '@tamanu/shared/services/fhirTypes';
import { Invalid } from '@tamanu/shared/utils/fhir';
import { FhirResource } from './Resource';
import type { InitOptions, Models } from '../../types/model';
import type { LabRequest } from '../../models/LabRequest';

export class FhirDiagnosticReport extends FhirResource {
  declare basedOn: { type: string; reference: string }[];
  declare status: string;
  declare code: Record<string, any>;
  declare presentedForm?: { data: string; title: string; contentType: string }[];

  static initModel(options: InitOptions, models: Models) {
    super.initResource(
      {
        basedOn: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        status: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        code: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        presentedForm: {
          type: DataTypes.JSONB,
        },
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
  async pushUpstream({ requesterId }: { requesterId: string }) {
    const { FhirServiceRequest, LabRequest } = this.sequelize.models;
    if (!this.basedOn || !Array.isArray(this.basedOn)) {
      throw new Invalid('DiagnosticReport requires basedOn to report results for ServiceRequest', {
        code: FHIR_ISSUE_TYPE.INVALID.VALUE,
      });
    }
    const { type, reference } = this.basedOn[0]!;

    const ref = reference.split('/');
    if (type !== 'ServiceRequest' || ref.length < 2 || ref[0] !== 'ServiceRequest') {
      throw new Invalid(`DiagnosticReport requires must be results for ServiceRequest'`, {
        code: FHIR_ISSUE_TYPE.INVALID.VALUE,
      });
    }
    const serviceRequestFhirId = ref[1];

    const serviceRequest = await FhirServiceRequest.findOne({
      where: { id: serviceRequestFhirId },
    });

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
      throw new Invalid(
        `No LabRequest with id: '${serviceRequest.upstreamId}', might be ImagingRequest id`,
      );
    }
    await this.sequelize.transaction(async () => {
      const newStatus = this.getLabRequestStatus();

      if (this.shouldUpdateLabRequestStatus(labRequest, newStatus)) {
        labRequest.set({ status: newStatus });
        if (newStatus === LAB_REQUEST_STATUSES.PUBLISHED) {
          labRequest.set({ publishedDate: getCurrentDateTimeString() });
        }
        await labRequest.save();

        if (!requesterId)
          throw new InvalidOperationError('No user found for LabRequest status change.');
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
    if (this.status === FHIR_DIAGNOSTIC_REPORT_STATUS.REGISTERED) {
      return LAB_REQUEST_STATUSES.RESULTS_PENDING;
    }

    if (this.status === FHIR_DIAGNOSTIC_REPORT_STATUS.PARTIAL._) {
      if (this.presentedForm) {
        return LAB_REQUEST_STATUSES.INTERIM_RESULTS;
      } else {
        return LAB_REQUEST_STATUSES.RESULTS_PENDING;
      }
    }

    if (this.status === FHIR_DIAGNOSTIC_REPORT_STATUS.PARTIAL.PRELIMINARY) {
      if (this.presentedForm) {
        return LAB_REQUEST_STATUSES.INTERIM_RESULTS;
      } else {
        return LAB_REQUEST_STATUSES.TO_BE_VERIFIED;
      }
    }

    if (this.status === FHIR_DIAGNOSTIC_REPORT_STATUS.FINAL) {
      if (this.presentedForm) {
        return LAB_REQUEST_STATUSES.PUBLISHED;
      } else {
        return LAB_REQUEST_STATUSES.VERIFIED;
      }
    }

    if (this.status === FHIR_DIAGNOSTIC_REPORT_STATUS.CANCELLED) {
      return LAB_REQUEST_STATUSES.CANCELLED;
    }

    if (this.status === FHIR_DIAGNOSTIC_REPORT_STATUS.ENTERED_IN_ERROR) {
      return LAB_REQUEST_STATUSES.ENTERED_IN_ERROR;
    }

    if (this.status === FHIR_DIAGNOSTIC_REPORT_STATUS.AMENDED._) {
      return LAB_REQUEST_STATUSES.INVALIDATED;
    }

    if (
      this.status === FHIR_DIAGNOSTIC_REPORT_STATUS.AMENDED.APPENDED ||
      this.status === FHIR_DIAGNOSTIC_REPORT_STATUS.AMENDED.CORRECTED
    ) {
      // no workflow for these yet
      throw new Invalid(`${this.status} workflow unsupported`);
    }

    throw new Invalid(`'${this.status}' is an invalid ServiceRequest status`);
  }

  shouldUpdateLabRequestStatus(labRequest: LabRequest, newStatus: LabRequest['status']) {
    if (!labRequest.status) {
      return false; // Don't update a status for a labRequest that doesn't support it
    }

    if (labRequest.status === newStatus) {
      return false; // No need to update if not changing the status
    }

    if (labRequest.status === LAB_REQUEST_STATUSES.PUBLISHED) {
      // Once a labRequest has been published, we can only change the status to INVALIDATED. Ignore all other status changes
      if (newStatus === LAB_REQUEST_STATUSES.INVALIDATED) {
        return true;
      }

      return false;
    }

    return true;
  }

  async saveAttachment(labRequest: LabRequest) {
    if (!Array.isArray(this.presentedForm) || this.presentedForm.length > 1) {
      throw new Invalid('presentedForm must be an array of length 1');
    }

    const form = this.presentedForm[0]!;
    if (!Object.values(SUPPORTED_CONTENT_TYPES).includes(form.contentType)) {
      throw new Invalid(
        `presentedForm must be one of the supported values: ${Object.values(
          SUPPORTED_CONTENT_TYPES,
        )}`,
      );
    }

    const { Attachment, LabRequestAttachment } = this.sequelize.models;
    const { data, type } = Attachment.sanitizeForDatabase({
      data: form.data,
      type: form.contentType,
    });
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
