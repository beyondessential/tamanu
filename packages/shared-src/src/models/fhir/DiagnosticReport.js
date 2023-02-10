import config from 'config';
import { Sequelize, DataTypes } from 'sequelize';

import { FHIR_INTERACTIONS, LAB_REQUEST_STATUSES } from 'shared/constants';

import { FhirResource } from './Resource';
import {
  FhirCodeableConcept,
  FhirCoding,
  FhirExtension,
  FhirIdentifier,
  FhirReference,
} from '../../services/fhirTypes';
import { latestDateTime } from '../../utils/dateTime';
import { formatFhirDate } from '../../utils/fhir';

export class FhirDiagnosticReport extends FhirResource {
  static init(options, models) {
    super.init(
      {
        extension: DataTypes.JSONB, // This field is part of DomainResource
        identifier: DataTypes.JSONB,
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

    this.UpstreamModel = models.LabTest;
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
  ]);

  async updateMaterialisation() {
    const {
      LabRequest,
      LabTestType,
      ReferenceData,
      Encounter,
      Patient,
      User,
    } = this.sequelize.models;

    const labTest = await this.getUpstream({
      include: [
        {
          model: LabRequest,
          as: 'labRequest',
          include: [
            {
              model: ReferenceData,
              as: 'laboratory',
            },
            {
              model: Encounter,
              as: 'encounter',
              include: [
                {
                  model: Patient,
                  as: 'patient',
                },
                {
                  model: User,
                  as: 'examiner',
                },
              ],
            },
          ],
        },
        {
          model: LabTestType,
          as: 'labTestType',
        },
        {
          model: ReferenceData,
          as: 'labTestMethod',
        },
      ],
    });

    const { labTestType, labTestMethod, labRequest } = labTest;
    const { encounter, laboratory } = labRequest;
    const { patient, examiner } = encounter;

    this.set({
      lastUpdated: latestDateTime(
        labTest.updatedAt,
        labRequest.updatedAt,
        labTestType.updatedAt,
        labTestMethod?.updatedAt,
        encounter.updatedAt,
        laboratory?.updatedAt,
        patient.updatedAt,
        examiner.updatedAt,
      ),
      extension: extension(labTestMethod),
      identifier: identifiers(labRequest),
      status: status(labRequest),
      code: code(labTestType),
      subject: patientReference(patient),
      effectiveDateTime: formatFhirDate(labRequest.sampleTime),
      issued: formatFhirDate(labRequest.requestedDate),
      performer: performer(laboratory, examiner),
      result: result(labTest, labRequest),
    });
  }
}

function extension(labTestMethod) {
  if (!labTestMethod) {
    return [];
  }

  const groupNamespace = `${config.hl7.dataDictionaries.testMethod}/covid-test-methods`;
  const testsNamespace = `${groupNamespace}/rdt`;

  return [
    new FhirExtension({
      url: groupNamespace,
      valueCodeableConcept: new FhirCodeableConcept({
        coding: [
          new FhirCoding({
            system: testsNamespace,
            code: labTestMethod.code,
            display: labTestMethod.name,
          }),
        ],
      }),
    }),
  ];
}

function identifiers(labRequest) {
  return [
    new FhirIdentifier({
      use: 'official',
      system: config.hl7.dataDictionaries.labRequestDisplayId,
      value: labRequest.displayId,
    }),
  ];
}

function status(labRequest) {
  switch (labRequest.status) {
    case LAB_REQUEST_STATUSES.PUBLISHED:
      return 'final';
    case LAB_REQUEST_STATUSES.RESULTS_PENDING:
      return 'registered';
    default:
      return 'unknown';
  }
}

function code(labTestType) {
  return new FhirCodeableConcept({
    text: labTestType.name,
    coding: [
      new FhirCoding({
        code: labTestType.code,
        display: labTestType.name,
      }),
    ],
  });
}

function patientReference(patient) {
  return new FhirReference({
    reference: `Patient/${patient.id}`,
    display: [patient.firstName, patient.lastName].filter(x => x).join(' '),
  });
}

function performer(laboratory, examiner) {
  return [
    laboratory &&
      new FhirReference({
        reference: `Organization/${laboratory.id}`,
        display: laboratory.name,
      }),
    new FhirReference({
      reference: `Practitioner/${examiner.id}`,
      display: examiner.displayName,
    }),
  ].filter(x => x);
}

function result(labTest, labRequest) {
  if (labRequest.status !== LAB_REQUEST_STATUSES.PUBLISHED) {
    return [];
  }

  return [
    new FhirReference({
      reference: `Observation/${labTest.id}`,
    }),
  ];
}
