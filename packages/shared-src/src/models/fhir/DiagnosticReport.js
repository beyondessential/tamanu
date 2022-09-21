import config from 'config';
import { Sequelize, DataTypes } from 'sequelize';

import { LAB_REQUEST_STATUSES } from 'shared/constants';
import { FhirResource } from './Resource';
import { dateType } from '../dateTimeTypes';
import { FhirCodeableConcept, FhirCoding, FhirIdentifier } from '../../services/fhirTypes';

export class FhirDiagnosticReport extends FhirResource {
  static init(options, models) {
    super.init(
      {
        identifier: this.ArrayOf('identifier', DataTypes.FHIR_IDENTIFIER),
        status: {
          type: Sequelize.STRING(16),
          allowNull: false,
        },
        category: this.ArrayOf('category', DataTypes.FHIR_CODEABLE_CONCEPT),
        code: this.ArrayOf('code', DataTypes.FHIR_CODEABLE_CONCEPT),
        effectiveDateTime: dateType('effectiveDateTime', { allowNull: true }),
        issued: dateType('issued', { allowNull: true }),
        performer: {}, // TODO: figure out field?
        result: {}, // TODO: ditto
      },
      options,
    );

    this.UpstreamModel = models.LabTest;
  }

  static initRelations(models) {
    this.belongsTo(models.FhirPatient, {
      foreignKey: 'subject',
      as: 'subjectPatient',
    });
  }

  async updateMaterialisation() {
    const { LabRequest, LabTestType, ReferenceData, Encounter, Patient } = this.sequelize.models;

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
      identifier: identifiers(labRequest),
      subject: patient.id,
      status: status(labRequest),
      effectiveDateTime: labRequest.sampleTime,
      issued: labRequest.requestedDate,
      code: code(labTestType),
      performer: performer(laboratory, examiner),
      result: result(labTest, labRequest),
      extension: extension(labTestMethod),
    });
  }
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
  return [
    new FhirCodeableConcept({
      text: labTestType.name,
      coding: [
        new FhirCoding({
          code: labTestType.code,
          display: labTestType.name,
        }),
      ],
    }),
  ];
}

function performer(laboratory, examiner) {
  return null; // TODO: figure out what to save here
}

function result(labTest, labRequest) {
  return null; // TODO: figure out what to save here
}

function extension(labTestMethod) {
  return null; // TODO: figure out what to save here
}
