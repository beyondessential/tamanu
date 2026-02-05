import config from 'config';

import { DataTypes } from 'sequelize';
import * as yup from 'yup';

import { FHIR_INTERACTIONS, FHIR_ISSUE_TYPE } from '@tamanu/constants';
import { getCurrentDateString, getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import {
  FhirCodeableConcept,
  FhirCoding,
  FhirQuantity,
  FhirReference,
  FhirTransactionBundle,
} from '@tamanu/shared/services/fhirTypes';
import { Invalid } from '@tamanu/shared/utils/fhir';
import { FhirResource } from './Resource';
import type { InitOptions, Models } from '../../types/model';
import type { LabRequest } from '../../models/LabRequest';
import { FhirDiagnosticReport } from './FhirDiagnosticReport';

export class FhirObservation extends FhirResource {
  declare basedOn: { type: string; reference: string }[];
  declare status: string;
  declare code: Record<string, any>;
  declare valueQuantity?: FhirQuantity;
  declare valueCodeableConcept?: FhirCodeableConcept;
  declare valueString?: string;

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
        valueQuantity: {
          type: DataTypes.JSONB,
        },
        valueCodeableConcept: {
          type: DataTypes.JSONB,
        },
        valueString: {
          type: DataTypes.TEXT,
        },
      },
      options,
    );

    this.UpstreamModels = [models.LabTest];
    this.upstreams = [models.LabTest, models.LabRequest, models.LabTestType];
  }

  static CAN_DO = new Set([FHIR_INTERACTIONS.TYPE.CREATE]);

  static get INTAKE_SCHEMA() {
    return yup.object({
      basedOn: yup.array().of(FhirReference.asYup()).required(),
      status: yup.string().required(),
      code: FhirCodeableConcept.asYup().required(),
      valueQuantity: FhirQuantity.asYup(),
      valueCodeableConcept: FhirCodeableConcept.asYup(),
      valueString: yup.string(),
    });
  }

  static hydrateRawResourceFromBundle(
    bundle: FhirTransactionBundle,
    rawResource: Record<string, any>,
  ) {
    const hydratedWithBasedOn = FhirObservation.hydrateBasedOn(bundle, rawResource);
    return hydratedWithBasedOn;
  }

  static hydrateBasedOn(bundle: FhirTransactionBundle, rawResource: Record<string, any>) {
    if (rawResource.basedOn) {
      // basedOn is already present, no need to hydrate
      return rawResource;
    }

    if (!rawResource.id) {
      throw new Invalid(`Observation id is required to link to a DiagnosticReport in a bundle`, {
        code: FHIR_ISSUE_TYPE.INVALID.VALUE,
      });
    }

    const validatedBundle = FhirTransactionBundle.SCHEMA().validateSync(bundle);
    // basedOn missing, need to look it up in the diagnostic report in the bundle
    const diagnosticReports = validatedBundle.entry
      .filter(entry => entry.resource.resourceType === 'DiagnosticReport')
      .map(report => FhirDiagnosticReport.INTAKE_SCHEMA.validateSync(report.resource));
    if (diagnosticReports.length === 0) {
      throw new Invalid(
        `Unable to determine basedOn of Observation/${rawResource.id}: No diagnostic report found in bundle`,
        {
          code: FHIR_ISSUE_TYPE.INVALID.VALUE,
        },
      );
    }

    const reportContainingObservation = diagnosticReports.find(report =>
      report.result?.some(result => result.reference === `Observation/${rawResource.id}`),
    );
    if (!reportContainingObservation) {
      throw new Invalid(
        `Unable to determine basedOn of Observation/${rawResource.id}: No diagnostic report found with result containing Observation/${rawResource.id}`,
        {
          code: FHIR_ISSUE_TYPE.INVALID.VALUE,
        },
      );
    }

    rawResource.basedOn = reportContainingObservation.basedOn;
    return rawResource;
  }

  async pushUpstream() {
    const { FhirServiceRequest, LabRequest } = this.sequelize.models;
    if (!this.basedOn || !Array.isArray(this.basedOn)) {
      throw new Invalid('Observation requires basedOn to link to its ServiceRequest', {
        code: FHIR_ISSUE_TYPE.INVALID.VALUE,
      });
    }
    const { type, reference } = this.basedOn[0]!;

    const ref = reference.split('/');
    if (type !== 'ServiceRequest' || ref.length < 2 || ref[0] !== 'ServiceRequest') {
      throw new Invalid(`Invalid ServiceRequest reference`, {
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

    const labRequest = await LabRequest.findByPk(serviceRequest.upstreamId);
    if (!labRequest) {
      throw new Invalid(
        `No LabRequest with id: '${serviceRequest.upstreamId}', might be ImagingRequest id`,
      );
    }

    const labTest = await this.getLabTestForObservation(labRequest);
    const value = this.getValue();

    await labTest.update({ result: value, completedDate: getCurrentDateTimeString() });
    return labTest;
  }

  async getLabTestForObservation(labRequest: LabRequest) {
    const { LabTest, LabTestType } = this.sequelize.models;
    const validatedCode = FhirCodeableConcept.SCHEMA().validateSync(this.code);
    if (!validatedCode.coding || validatedCode.coding.length === 0) {
      throw new Invalid('Invalid code, must provide at least one coding', {
        code: FHIR_ISSUE_TYPE.INVALID.VALUE,
      });
    }

    const validatedCoding = yup
      .array()
      .of(FhirCoding.SCHEMA())
      .required()
      .validateSync(validatedCode.coding);

    const validatedCodings = validatedCoding.map((coding: FhirCoding) =>
      FhirCoding.asYup().validateSync(coding),
    );

    const labTestCode = validatedCodings.find(
      coding => coding.system === config.hl7.dataDictionaries.serviceRequestLabTestCodeSystem,
    )?.code;

    const labTestExternalCode = validatedCodings.find(
      coding =>
        coding.system === config.hl7.dataDictionaries.serviceRequestLabTestExternalCodeSystem,
    )?.code;

    if (!labTestCode && !labTestExternalCode) {
      throw new Invalid('Invalid code, must provide a code of one of the configured systems:', {
        systems: [
          config.hl7.dataDictionaries.serviceRequestLabTestCodeSystem,
          config.hl7.dataDictionaries.serviceRequestLabTestExternalCodeSystem,
        ],
      });
    }

    let labTest =
      (labTestCode &&
        (await LabTest.findOne({
          include: [{ model: LabTestType, as: 'labTestType' }],
          where: { labRequestId: labRequest.id, '$labTestType.code$': labTestCode },
        }))) ||
      (labTestExternalCode &&
        (await LabTest.findOne({
          include: [{ model: LabTestType, as: 'labTestType' }],
          where: {
            labRequestId: labRequest.id,
            '$labTestType.external_code$': labTestExternalCode,
          },
        })));

    if (!labTest) {
      const labTestType =
        (labTestCode &&
          (await LabTestType.findOne({
            where: { code: labTestCode },
          }))) ||
        (labTestExternalCode &&
          (await LabTestType.findOne({
            where: { externalCode: labTestExternalCode },
          })));

      if (!labTestType) {
        throw new Invalid(
          `Cannot create reflex test, no lab test type found with ${labTestCode ? 'code' : 'externalCode'} ${labTestCode || labTestExternalCode}`,
          {
            code: FHIR_ISSUE_TYPE.INVALID.VALUE,
          },
        );
      }

      // No pre-existing lab test found, this must be a reflex test, so create a new test to track that
      labTest = await LabTest.create({
        labRequestId: labRequest.id,
        labTestTypeId: labTestType.id,
        date: getCurrentDateString(),
      });
    }

    return labTest;
  }

  getValue() {
    if (this.valueQuantity) {
      const validatedValueQuantity = FhirQuantity.SCHEMA().validateSync(this.valueQuantity);
      return `${validatedValueQuantity.value}`;
    }

    if (this.valueCodeableConcept) {
      const validatedValueCodeableConcept = FhirCodeableConcept.SCHEMA().validateSync(
        this.valueCodeableConcept,
      );
      const valueCode = validatedValueCodeableConcept.coding[0]?.code;
      if (!valueCode) {
        throw new Invalid('Invalid code, must provide at least one coding', {
          code: FHIR_ISSUE_TYPE.INVALID.VALUE,
        });
      }
      return valueCode;
    }

    if (!this.valueString) {
      throw new Invalid(
        'Invalid value, must provide a valueString or valueQuantity or valueCodeableConcept',
        {
          code: FHIR_ISSUE_TYPE.INVALID.VALUE,
        },
      );
    }
    return this.valueString;
  }
}
