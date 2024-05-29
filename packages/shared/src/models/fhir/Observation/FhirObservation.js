import { DataTypes, Sequelize } from 'sequelize';
import * as yup from 'yup';

import {
  FHIR_DIAGNOSTIC_REPORT_STATUS,
  FHIR_INTERACTIONS,
} from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/shared/errors';
import { FhirCodeableConcept, FhirReference } from '../../../services/fhirTypes';
import { FhirResource } from '../Resource';
import { Invalid, parseBasedOn } from '../../../utils/fhir';

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
        subject: {
          type: DataTypes.JSONB,
        },
        valueQuantity: {
          type: DataTypes.JSONB,
        },
        referenceRange: {
          type: DataTypes.JSONB,
        },
        note: {
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
      basedOn: yup.array().of(FhirReference.asYup()),
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

  setBasedOn(basedOn) {
    this.basedOn = basedOn;
  }

  async pushUpstream({ requesterId }) {
    const serviceRequestFhirId = parseBasedOn(this.basedOn[0], ['ServiceRequest']);
    console.log({ serviceRequestFhirId });
  }
}
