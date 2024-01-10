import asyncHandler from 'express-async-handler';
import { NotFoundError } from '@tamanu/shared/errors';

import { getHL7Payload } from './getHL7Payload';
import { patientToHL7Patient, patientToHL7PatientList, getPatientWhereClause } from './patient';
import {
  hl7StatusToLabRequestStatus,
  labTestToHL7Device,
  labTestToHL7DiagnosticReport,
  labTestToHL7Observation,
} from './labTest';
import * as schema from './schema';
import {
  administeredVaccineToHL7Immunization,
  getAdministeredVaccineInclude,
} from './administeredVaccine';

export function patientHandler() {
  return asyncHandler(async (req, res) => {
    const { Patient } = req.store.models;
    const payload = await getHL7Payload({
      req,
      querySchema: schema.patient.query,
      model: Patient,
      getWhere: getPatientWhereClause,
      getInclude: () => [{ association: 'additionalData' }],
      bundleId: 'patients',
      toHL7List: patients => patientToHL7PatientList(req, patients),
      extraOptions: { paranoid: false }, // to allow getting inactive patient
    });

    res.send(payload);
  });
}

export function diagnosticReportHandler() {
  return asyncHandler(async (req, res) => {
    const payload = await getHL7Payload({
      req,
      querySchema: schema.diagnosticReport.query,
      model: req.store.models.LabTest,
      getWhere: () => ({}), // deliberately empty, join with a patient instead
      getInclude: (displayId, { status }) => [
        { association: 'labTestType' },
        { association: 'labTestMethod' },
        {
          association: 'labRequest',
          required: true,
          where: status ? { status: hl7StatusToLabRequestStatus(status) } : null,
          include: [
            { association: 'laboratory' },
            {
              association: 'encounter',
              required: true,
              include: [
                { association: 'examiner' },
                {
                  association: 'patient',
                  where: { displayId },
                },
              ],
            },
          ],
        },
      ],
      bundleId: 'diagnostic-reports',
      toHL7: (labTest, { _include }) => {
        const includedResources = [];
        if (_include && _include.includes(schema.DIAGNOSTIC_REPORT_INCLUDES.RESULT)) {
          includedResources.push(labTestToHL7Observation(labTest));
        }
        if (_include && _include.includes(schema.DIAGNOSTIC_REPORT_INCLUDES.DEVICE)) {
          includedResources.push(labTestToHL7Device(labTest));
        }
        return {
          mainResource: labTestToHL7DiagnosticReport(labTest),
          includedResources: includedResources.map(resource => ({ resource })),
        };
      },
    });

    res.send(payload);
  });
}

export function immunizationHandler() {
  return asyncHandler(async (req, res) => {
    const payload = await getHL7Payload({
      req,
      querySchema: schema.immunization.query,
      model: req.store.models.AdministeredVaccine,
      getWhere: () => ({}), // deliberately empty
      getInclude: getAdministeredVaccineInclude,
      bundleId: 'immunizations',
      toHL7: administeredVaccine => ({
        mainResource: administeredVaccineToHL7Immunization(administeredVaccine),
      }),
    });

    res.send(payload);
  });
}

function findSingleResource(modelName, include, toHL7Fn, where = {}, extraOptions = {}) {
  return asyncHandler(async (req, res) => {
    const { models } = req.store;
    const { id } = req.params;
    const record = await models[modelName].findOne({
      where: { id, ...where },
      include,
      ...extraOptions,
    });

    if (!record) {
      throw new NotFoundError(`Unable to find resource ${id}`);
    }

    const resource = await toHL7Fn(record, req);
    res.send(resource);
  });
}

export function singlePatientHandler() {
  return findSingleResource(
    'Patient',
    [{ association: 'additionalData' }],
    (patient, req) => patientToHL7Patient(req, patient, patient.additionalData[0]),
    getPatientWhereClause(null, {}), // to only get active or merged patients
    { paranoid: false }, // to allow getting inactive patient
  );
}

export function singleDiagnosticReportHandler() {
  return findSingleResource(
    'LabTest',
    [
      { association: 'labTestType' },
      { association: 'labTestMethod' },
      {
        association: 'labRequest',
        required: true,
        include: [
          { association: 'laboratory' },
          {
            association: 'encounter',
            required: true,
            include: [{ association: 'examiner' }, { association: 'patient' }],
          },
        ],
      },
    ],
    labTestToHL7DiagnosticReport,
  );
}

export function singleImmunizationHandler() {
  return findSingleResource(
    'AdministeredVaccine',
    getAdministeredVaccineInclude(null, {}),
    administeredVaccineToHL7Immunization,
  );
}
