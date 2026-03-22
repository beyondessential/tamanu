import { subject } from '@casl/ability';
import { NotFoundError } from '@tamanu/errors';

/**
 * Check if the request is valid for patient program registration
 * Checks if the patient and program registry exist and if the user has the required permissions
 */
export const validatePatientProgramRegistrationRequest = async (
  req,
  patientId,
  programRegistryId,
) => {
  const { checkPermission, models } = req;

  checkPermission('read', 'Patient');
  checkPermission('read', subject('ProgramRegistry', { id: programRegistryId }));

  const patient = await models.Patient.findByPk(patientId);
  if (!patient) throw new NotFoundError();

  const programRegistry = await models.ProgramRegistry.findByPk(programRegistryId);
  if (!programRegistry) throw new NotFoundError();

  return true;
};
