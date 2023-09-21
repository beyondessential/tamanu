import { format } from 'date-fns';
import { Op } from 'sequelize';
import { groupBy, keyBy } from 'lodash';
import { VISIBILITY_STATUSES, FHIR_PATIENT_LINK_TYPES } from '@tamanu/constants';

import {
  getParamAndModifier,
  getQueryObject,
  getDefaultOperator,
  getBaseUrl,
  getHL7Link,
} from './utils';

import { modifiers } from './hl7Parameters';
import { hl7PatientFields } from './hl7PatientFields';

function patientName(patient, additional, { nullLastNameValue }) {
  const official = {
    use: 'official',
    prefix: additional.title ? [additional.title] : [],
    // lastName is not a mandatory field in Tamanu, but is in HL7
    // Some patients genuinely do not have last names, so, just send
    // a preconfigured string in this circumstance.
    family: patient.lastName || nullLastNameValue,
    given: [patient.firstName, patient.middleName].filter(x => x),
  };

  if (!patient.culturalName) {
    return [official];
  }

  return [
    official,
    {
      use: 'nickname',
      text: patient.culturalName,
    },
  ];
}

function patientIds(patient, additional, { assigners, dataDictionaries }) {
  return [
    {
      use: 'usual',
      value: patient.displayId,
      // TODO: use db config fetcher
      assigner: assigners.patientDisplayId,
      system: dataDictionaries.patientDisplayId,
    },
    {
      use: 'secondary',
      assigner: assigners.patientPassport,
      value: additional.passportNumber,
    },
    {
      use: 'secondary',
      assigner: assigners.patientDrivingLicense,
      value: additional.drivingLicense,
    },
  ].filter(x => x.value);
}

function patientAddress(patient, additional) {
  const { cityTown, streetVillage } = additional;
  if (!cityTown && !streetVillage) return [];
  return [
    {
      type: 'physical',
      use: 'home',
      city: additional.cityTown,
      line: additional.streetVillage ? [additional.streetVillage] : [],
    },
  ];
}

function patientTelecom(patient, additional) {
  return [additional.primaryContactNumber, additional.secondaryContactNumber]
    .filter(x => x)
    .map((value, index) => ({
      rank: index + 1,
      value,
    }));
}

function isPatientActive(patient) {
  if (patient.visibilityStatus === VISIBILITY_STATUSES.CURRENT) return true;
  return false;
}

const convertPatientToHL7Patient = (patient, hl7Settings, additional = {}) => ({
  resourceType: 'Patient',
  id: patient.id,
  active: isPatientActive(patient),
  identifier: patientIds(patient, additional, hl7Settings),
  name: patientName(patient, additional, hl7Settings),
  birthDate: patient.dateOfBirth,
  gender: patient.sex,
  address: patientAddress(patient, additional),
  telecom: patientTelecom(patient, additional),
  // Only add deceasedDateTime key if the patient is deceased
  ...(patient.dateOfDeath && {
    deceasedDateTime: format(new Date(patient.dateOfDeath), "yyyy-MM-dd'T'HH:mm:ssXXX"),
  }),
});

/**
 * Traverse down the merge tree and build any replaces links
 *
 * eg:
 * b <- merged into - c then
 * b <- merged into - d then
 * a <- merged into - b
 *
 * We should have:
 * Patient a:
 * link: [
 *  {patient b, type = replaces}
 *  {patient c, type = replaces}
 *  {patient d, type = replaces}
 * ]
 */
export function getFlattenMergedPatientReplaceLinks(
  baseUrl,
  patient,
  mergedPatientsByMergedIntoId,
  isRootPatientActive,
) {
  let links = [];
  const mergedPatients = mergedPatientsByMergedIntoId[patient.id] || [];

  for (const mergedPatient of mergedPatients) {
    links.push({
      other: {
        reference: getHL7Link(`${baseUrl}/Patient/${mergedPatient.id}`),
      },
      type: isRootPatientActive
        ? FHIR_PATIENT_LINK_TYPES.REPLACES
        : FHIR_PATIENT_LINK_TYPES.SEE_ALSO,
    });
    // get deeper level of merged patients if there's any
    links = links.concat(
      getFlattenMergedPatientReplaceLinks(
        baseUrl,
        mergedPatient,
        mergedPatientsByMergedIntoId,
        isRootPatientActive,
      ),
    );
  }

  return links;
}

/**
 * Traverse up the merge tree and build any replaced-by/seealso links
 * replaced-by should be the latest active patient
 * seealso should be the inactive patients
 *
 * eg:
 * b <- merged into - c then
 * b <- merged into - d then
 * a <- merged into - b
 *
 * We should have:
 * Patient c:
 * link: [
 *  {patient a, type = replaced-by}
 *  {patient b, type = seealso}
 * ]
 */
export function getFlattenMergedPatientReplacecByLinks(baseUrl, patient, patientById) {
  let links = [];
  const supersededPatient = patientById[patient.mergedIntoId];

  if (patient.mergedIntoId && supersededPatient?.mergedIntoId) {
    links.push({
      other: {
        reference: getHL7Link(`${baseUrl}/Patient/${patient.mergedIntoId}`),
      },
      type: FHIR_PATIENT_LINK_TYPES.SEE_ALSO,
    });
    links = links.concat(
      getFlattenMergedPatientReplacecByLinks(baseUrl, supersededPatient, patientById),
    );
  } else {
    links.push({
      other: {
        reference: getHL7Link(`${baseUrl}/Patient/${patient.mergedIntoId}`),
      },
      type: FHIR_PATIENT_LINK_TYPES.REPLACED_BY,
    });
  }

  return links;
}

const getMergedPatientByMergedIntoId = async models => {
  const allMergedPatients = await models.Patient.findAll({
    attributes: ['id', 'mergedIntoId'],
    where: { mergedIntoId: { [Op.not]: null } },
    paranoid: false,
  });
  return groupBy(allMergedPatients, 'mergedIntoId');
};

const getPatientById = async models => {
  // This is going to fetch all active and inactive patients
  // which can be memory heavy. But we only fetch the minimum
  // info that we need which is id and mergedIntoId.
  // So I think it is acceptable.
  const patients = await models.Patient.findAll({
    attributes: ['id', 'mergedIntoId'],
    paranoid: false,
    where: {
      visibilityStatus: { [Op.in]: [VISIBILITY_STATUSES.CURRENT, VISIBILITY_STATUSES.MERGED] },
    },
  });
  return keyBy(patients, 'id');
};

const getPatientLinks = (
  baseUrl,
  patient,
  patientById,
  mergedPatientsByMergedIntoId,
  isRootPatientActive,
) => {
  let links = [];

  // Get 'replaced-by/seealso' links of a patient if there's any
  if (patient.mergedIntoId) {
    links = getFlattenMergedPatientReplacecByLinks(baseUrl, patient, patientById);
  }

  const mergedPatients = mergedPatientsByMergedIntoId[patient.id] || [];

  // Get 'replaces' links of a patient if there's any
  if (mergedPatients.length) {
    links = links.concat(
      getFlattenMergedPatientReplaceLinks(
        baseUrl,
        patient,
        mergedPatientsByMergedIntoId,
        isRootPatientActive,
      ),
    );
  }

  // Reorder seealso links to be after replaces/replaced-by links
  const seeAlsoLinks = links.filter(l => l.type === FHIR_PATIENT_LINK_TYPES.SEE_ALSO);
  const otherLinks = links.filter(l => l.type !== FHIR_PATIENT_LINK_TYPES.SEE_ALSO);

  return [...otherLinks, ...seeAlsoLinks];
};

export const patientToHL7Patient = async (req, patient, additional = {}) => {
  const { settings, store } = req;
  const { models } = store;
  const baseUrl = getBaseUrl(req, false);
  const hl7Settings = await settings.get('hl7');
  const mergedPatientsByMergedIntoId = await getMergedPatientByMergedIntoId(models);
  const patientById = await getPatientById(models);
  const isRootPatientActive = Boolean(!patient.mergedIntoId);
  const links = getPatientLinks(
    baseUrl,
    patient,
    patientById,
    mergedPatientsByMergedIntoId,
    isRootPatientActive,
  );
  const hl7Patient = convertPatientToHL7Patient(patient, hl7Settings, additional);

  return { ...hl7Patient, ...(links.length ? { link: links } : {}) };
};

export const patientToHL7PatientList = async (req, patients) => {
  const { store, settings } = req;
  const { models } = store;
  const baseUrl = getBaseUrl(req, false);
  const mergedPatientsByMergedIntoId = await getMergedPatientByMergedIntoId(models);
  const patientById = await getPatientById(models);
  const hl7Patients = [];
  const hl7Settings = await settings.get('hl7');

  for (const patient of patients) {
    const hl7Patient = convertPatientToHL7Patient(
      patient,
      hl7Settings,
      patient.additionalData?.[0],
    );
    const isRootPatientActive = Boolean(!patient.mergedIntoId);
    const links = getPatientLinks(
      baseUrl,
      patient,
      patientById,
      mergedPatientsByMergedIntoId,
      isRootPatientActive,
    );

    hl7Patients.push({ ...hl7Patient, ...(links.length ? { link: links } : {}) });
  }

  return hl7Patients;
};

// Receives query and returns a sequelize where clause.
// Assumes that query already passed validation.
export function getPatientWhereClause(displayId, query = {}) {
  // to only get active or merged patients
  const filters = [
    {
      [Op.or]: [
        { visibilityStatus: VISIBILITY_STATUSES.CURRENT, deletedAt: null },
        { visibilityStatus: VISIBILITY_STATUSES.MERGED },
      ],
    },
  ];

  // Handle search by ID separately
  if (displayId) {
    filters.push({ displayId });
  }

  // Create a filter for each query param
  Object.entries(query).forEach(([key, value]) => {
    const [parameter, modifier] = getParamAndModifier(key);

    // Only create filter if the parameter is a supported patient field
    if (parameter in hl7PatientFields === false) {
      return;
    }

    const { fieldName, columnName, parameterType, getValue, getOperator } = hl7PatientFields[
      parameter
    ];
    const defaultOperator = getOperator ? getOperator(value) : getDefaultOperator(parameterType);
    const operator = modifier ? modifiers[parameterType][modifier] : defaultOperator;
    const extractedValue = getValue ? getValue(value) : value;
    const queryObject = getQueryObject(
      columnName,
      extractedValue,
      operator,
      modifier,
      parameterType,
    );
    filters.push({ [fieldName]: queryObject });
  });

  // Wrap all filters with explicit "AND" if they exist,
  // otherwise return empty object
  return filters.length > 0 ? { [Op.and]: filters } : {};
}
