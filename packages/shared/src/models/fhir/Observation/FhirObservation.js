import { DataTypes, Sequelize } from 'sequelize';
import * as yup from 'yup';
import config from 'config';

import {
  FHIR_INTERACTIONS,
  FHIR_OBSERVATION_STATUS,
  LAB_TEST_RESULT_TYPES,
  LAB_TEST_STATUSES,
} from '@tamanu/constants';
import { getCurrentDateString } from '@tamanu/shared/utils/dateTime';
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
        valueBoolean: {
          type: DataTypes.JSONB,
        },
        valueString: {
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
    const valueShape = type => yup.object().shape({
      value: type,
      unit: yup.string(),
    });
    return yup.object({
      status: yup.string().required(),
      id: yup.string().required(),
      basedOn: yup.array().of(FhirReference.asYup()),
      code: FhirCodeableConcept.asYup().required(),
      valueQuantity: valueShape(yup.number()),
      valueString: valueShape(yup.string()),
      referenceRange: yup
        .array()
        .of(
          yup.object({
            high: valueShape(yup.number()).required(),
            low: valueShape(yup.number()).required(),
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
    const externalTestCode = this.getExternalTestCode();
    const internalTestCode = this.getInternalTestCode();
    const codeClause = !!externalTestCode ?
      ({
        externalCode: externalTestCode,
      }) :
      ({
        code: internalTestCode,
      });
    const { LabTestType } = this.sequelize.models;
    const currentTestType = await LabTestType.findOne({
      where: {
        ...codeClause,
        labTestCategoryId: labRequest.labTestCategoryId,
      }
    });
    if (!currentTestType) {
      throw new Invalid(`No lab test in system '${!!labTestCodingExternal ? externalCodingSystem : internalCodingSystem}' coding system with code '${testCode}'`);
    }

    const matchedTest = tests.find(test => currentTestType.id === test.labTestTypeId);
    const value = await this.parseValue(currentTestType);
    const currentUser = await this.sequelize.models.User.findByPk(requesterId);
    await this.sequelize.transaction(async () => {
      let testCreated = null;
      if (matchedTest) {
        matchedTest.set({
          status: LAB_TEST_STATUSES.VERIFIED,
          result: value,
          laboratoryOfficer: currentUser ? currentUser.name : null,
          completedDate: getCurrentDateString(),
        });
        testCreated = await matchedTest.save();
      } else {
        console.debug(`Adding results for lab test id: ${currentTestType.id} not in original request`);
        testCreated = await this.sequelize.models.LabTest.create({
          status: LAB_TEST_STATUSES.VERIFIED,
          result: value,
          labRequestId: labRequest.id,
          labTestTypeId: currentTestType.id,
          laboratoryOfficer: currentUser ? currentUser.name : null,
          completedDate: getCurrentDateString(),
        });
      }
      await this.sequelize.models.LabRequestLog.create({
        status: labRequest.status,
        labRequestId: labRequest.id,
        updatedById: requesterId,
      });
      return testCreated;
    });
  }

  getInternalTestCode() {
    const internalCodingSystem = config.hl7.dataDictionaries.serviceRequestLabTestCodeSystem;
    return this.code.coding.find(coding => coding.system === internalCodingSystem)?.code;
  }
  getExternalTestCode() {
    const externalCodingSystem = config.hl7.dataDictionaries.serviceRequestLabTestExternalCodeSystem;
    return this.code.coding.find(coding => coding.system === externalCodingSystem)?.code;
  }

  parseValue(currentTestType) {
    const printableTestCode = this.getExternalTestCode() || this.getInternalTestCode();
    switch (currentTestType.resultType) {
      case LAB_TEST_RESULT_TYPES.NUMBER:
        if (!this.valueQuantity) {
          throw new Invalid(`Observation with code '${printableTestCode}' is results for a ${LAB_TEST_RESULT_TYPES.NUMBER}, it requires a valueQuantity value`);
        }
        return this.valueQuantity.value;
      case LAB_TEST_RESULT_TYPES.FREE_TEXT:
        if (!this.valueString) {
          throw new Invalid(`Observation with code '${printableTestCode}' is results for a ${LAB_TEST_RESULT_TYPES.FREE_TEXT}, it requires a valueString value`);
        }
        return this.valueString.value;
      case LAB_TEST_RESULT_TYPES.SELECT:
        if (!this.valueString) {
          throw new Invalid(`Observation with code '${printableTestCode}' is results for a ${LAB_TEST_RESULT_TYPES.SELECT}, it requires a valueString value`);
        }
        // some options are delimited by ', ' sometimes by just ','
        if (!currentTestType.options.replace(', ', ',').split(',').includes(this.valueString.value)) {
          throw new Invalid(`Observation with code '${printableTestCode}' needs valueString.value to be one of: ${currentTestType.options}`);
        }
        return this.valueString.value;
      default:
        throw new Invalid(`We do not support parsing results of type ${currentTestType.resultType}`);
    }
  }
}
