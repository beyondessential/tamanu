import asyncHandler from 'express-async-handler';
import { REFERENCE_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { ValidationError } from '@tamanu/errors';
import {
  PatientWithAdditionalDataSchema,
  UpdatePatientDetailsRequestSchema,
} from '@tamanu/shared/schemas/patientPortal';

/** The reference data a patient's details show by name. */
const ADDITIONAL_DATA_RELATIONS = ['ethnicity', 'insurer', 'occupation'];

const sendPatient = async (req, res, patient) => {
  const village = await patient.getVillage();
  const additionalData = await req.store.models.PatientAdditionalData.findOne({
    where: { patientId: patient.id },
    include: ADDITIONAL_DATA_RELATIONS,
  });
  await req.audit.access({
    recordId: patient.id,
    model: req.models.Patient,
  });
  res.send(
    PatientWithAdditionalDataSchema.parse({
      ...patient.forResponse(),
      village: village?.forResponse(),
      additionalData: additionalData?.forResponse() ?? null,
    }),
  );
};

export const getPatient = asyncHandler(async (req, res) => {
  await sendPatient(req, res, req.patient);
});

const REFERENCE_DATA_DETAILS = {
  ethnicityId: REFERENCE_TYPES.ETHNICITY,
  insurerId: REFERENCE_TYPES.INSURER,
  occupationId: REFERENCE_TYPES.OCCUPATION,
};

/**
 * Details the deployment hides can't be changed, and required ones can't be left blank, judged on
 * the record as it will be after saving so a detail already blank still has to be filled in.
 */
const checkAgainstFieldSettings = (changes, currentDetails, fieldSettings) => {
  for (const field of Object.keys(changes)) {
    if (fieldSettings[field]?.hidden) {
      throw new ValidationError(`${field} is not used by this deployment`);
    }
  }
  for (const field of Object.keys(UpdatePatientDetailsRequestSchema.shape)) {
    const { hidden, required } = fieldSettings[field] ?? {};
    const value = field in changes ? changes[field] : currentDetails[field];
    if (required && !hidden && (value ?? '') === '') {
      throw new ValidationError(`${field} is required`);
    }
  }
};

const checkReferenceData = async (changes, models) => {
  for (const [field, type] of Object.entries(REFERENCE_DATA_DETAILS)) {
    const id = changes[field];
    if (!id) continue;
    const referenceData = await models.ReferenceData.findOne({
      where: { id, type, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
    });
    if (!referenceData) {
      throw new ValidationError(`${field} is not a current ${type}`);
    }
  }
};

/**
 * Updates the details a patient can keep up to date themselves. Only the details sent are
 * written, so changes staff made to other details in the meantime are kept.
 */
export const updatePatient = asyncHandler(async (req, res) => {
  const { patient } = req;
  const { models, sequelize } = req.store;
  const { email, ...additionalDataChanges } = UpdatePatientDetailsRequestSchema.parse(req.body);
  const changes = { ...additionalDataChanges, ...(email !== undefined && { email }) };

  const additionalData = await models.PatientAdditionalData.findOne({
    where: { patientId: patient.id },
  });
  checkAgainstFieldSettings(
    changes,
    { ...additionalData?.get({ plain: true }), email: patient.email },
    (await req.settings.get('fields')) ?? {},
  );
  await checkReferenceData(changes, models);

  await sequelize.transaction(async () => {
    if (email !== undefined) {
      await patient.update({ email });
    }
    if (Object.keys(additionalDataChanges).length > 0) {
      await models.PatientAdditionalData.updateForPatient(patient.id, additionalDataChanges);
    }
  });

  await sendPatient(req, res, await patient.reload());
});
