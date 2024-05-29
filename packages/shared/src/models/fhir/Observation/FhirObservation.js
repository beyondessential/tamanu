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

export class FhirObservation extends FhirResource {
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
    ];
  }

  static CAN_DO = new Set([FHIR_INTERACTIONS.TYPE.CREATE]);

  static get INTAKE_SCHEMA() {
    const valueShape = yup.object({
      value: yup.number().required(),
      unit: yup.string(),
    });
    return yup.object({
      status: yup.string().required(),
      id: yup.string().required(),
      code: FhirCodeableConcept.asYup().required(),
      subject: FhirReference.asYup(),
      valueQuantity: valueShape,
      referenceRange: yup
        .array()
        .of(
          yup.object({
            high: valueShape.required(),
            low: valueShape.required(),
          })),
      note: yup.array().of(
        yup.object({
          text: yup.string(),
        })),
    });
  }




  // This is beginning very modestly - can extend to handle full 
  // results soon.
  async pushUpstream({ requesterId }) {
  }

  getLabRequestStatus() {
  }

  async saveAttachment(labRequest) {
  }
}
