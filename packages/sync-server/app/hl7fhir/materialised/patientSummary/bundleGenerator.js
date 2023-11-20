import config from 'config';
import { v4 as uuidv4 } from 'uuid';

import { FHIR_RESOURCE_TYPES } from '@tamanu/constants';

import { NotFound, formatFhirDate } from '@tamanu/shared/utils/fhir';

import {
  getComposition,
  getAllergyIntolerances,
  getMedicationStatements,
  getConditions,
  getImmunizations,
  getHl7Patient,
} from './helpers';

import { getBundleEntryFromResource } from './utils';

export const generateBundle = async (fhirPatientId, user, models) => {
  const dataDictionariesIps = config.hl7.dataDictionaries.ips;
  const integrationsIps = config.integrations.ips;

  const fhirPatient = await models.FhirPatient.findByPk(fhirPatientId);
  if (!fhirPatient) throw new NotFound(`No FHIR patient with id ${fhirPatientId}`);

  const patientId = fhirPatient.upstreamId;
  if (!patientId)
    throw new NotFound(`No upstream patient for fhir patient with id ${fhirPatientId}`);

  const patient = await models.Patient.findByPk(patientId);
  if (!patient) throw new NotFound(`No public patient with id ${patientId}`);

  // We set this to an ID independent of the DB ecosystem
  // Alternatively, we could fetch the patient from the fhir schema in the DB
  patient.id = fhirPatientId;

  const [
    medicationStatements,
    allergyIntolerances,
    conditions,
    immunizations,
    hl7Patient,
  ] = await Promise.all([
    getMedicationStatements({
      patient,
      models,
      dataDictionariesIps,
    }),
    getAllergyIntolerances({
      patient,
      models,
      dataDictionariesIps,
    }),
    getConditions({
      patient,
      models,
      dataDictionariesIps,
    }),
    getImmunizations({
      patient,
      models,
      dataDictionariesIps,
    }),
    getHl7Patient({ patient, models }),
  ]);

  const now = new Date();

  const composition = getComposition({
    patient,
    user,
    integrationsIps,
    now,
    medicationStatements,
    allergyIntolerances,
    conditions,
    immunizations,
  });

  const bundle = {
    id: uuidv4(),
    resourceType: FHIR_RESOURCE_TYPES.BUNDLE,
    language: 'en-AU',
    identifier: {
      system: 'urn:oid:2.16.724.4.8.10.200.10',
      value: uuidv4(),
    },
    type: 'document',
    timestamp: formatFhirDate(now),
    entry: [
      getBundleEntryFromResource(composition),
      getBundleEntryFromResource(hl7Patient),
      ...conditions.map(condition => getBundleEntryFromResource(condition)),
      ...medicationStatements.map(medicationStatement =>
        getBundleEntryFromResource(medicationStatement),
      ),
      ...allergyIntolerances.map(allergyIntolerance =>
        getBundleEntryFromResource(allergyIntolerance),
      ),
      ...immunizations.map(immunization => getBundleEntryFromResource(immunization)),
    ],
  };

  return { patient, bundle };
};
