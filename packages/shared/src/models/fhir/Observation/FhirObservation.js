import { DataTypes, Sequelize } from 'sequelize';
import * as yup from 'yup';
import config from 'config';

import {
  FHIR_INTERACTIONS,
  FHIR_OBSERVATION_STATUS,
} from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/shared/errors';
import { FhirCodeableConcept, FhirReference } from '../../../services/fhirTypes';
import { FhirResource } from '../Resource';
import { Invalid, getLabRequestFromBasedOn } from '../../../utils/fhir';

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
    if (this.status !== FHIR_OBSERVATION_STATUS.FINAL) {
      throw new Invalid(`Observation with status '${this.status}', only 'final' allowed`);
    }
    const labRequest = await getLabRequestFromBasedOn(this.basedOn, this.sequelize.models, ['ServiceRequest']);
    if (!labRequest) {
      throw new Invalid(`No LabRequest with id: '${serviceRequest.upstreamId}', might be ImagingRequest id`);
    }

    const tests = await labRequest.getTests();
    const internalCodingSystem = config.hl7.dataDictionaries.serviceRequestLabTestCodeSystem;
    const externalCodingSystem = config.hl7.dataDictionaries.serviceRequestLabTestExternalCodeSystem;

    const labTestCodingInternal = this.code.coding.find(coding => (
      coding.system === internalCodingSystem
    ))?.code;
    const labTestCodingExternal = this.code.coding.find(coding => {
      console.log({ externalCodingSystem, system: coding.system})
      return coding.system === externalCodingSystem;
    })?.code;

    const testCode = labTestCodingExternal || labTestCodingInternal;
    const { LabTestType } = this.sequelize.models;
    const currentTestType = await LabTestType.findOne({
      where: {
        externalCode: testCode,
        labTestCategoryId: labRequest.labTestCategoryId,
      }
    });

    if (!currentTestType) {
      throw new Invalid(`No lab test in system '${!!labTestCodingExternal ? externalCodingSystem : internalCodingSystem}' coding system with code '${testCode}'`);
    }

    const matchedTest = tests.find(test => currentTestType.id === test.labTestTypeId);

    if (!matchedTest) {
      console.debug(`Adding results for lab test id: ${currentTestType.id} not in original request`)
    }
    await this.sequelize.transaction(async () => {

      if (labRequest.status) {
        // labRequest.set({ status: newStatus });
        // await labRequest.save();

        if (!requesterId) throw new InvalidOperationError('No user found for LabRequest status change.');
        // await this.sequelize.models.LabRequestLog.create({
        //   status: newStatus,
        //   labRequestId: labRequest.id,
        //   updatedById: requesterId,
        // });
      }
    });

    return labRequest;



  }
}
