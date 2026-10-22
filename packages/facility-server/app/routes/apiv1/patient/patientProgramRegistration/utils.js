import { subject } from '@casl/ability';
import { NotFoundError } from '@tamanu/errors';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

/**
 * Resolve the deactivation columns for a registration write. Registrations are reused rather than
 * recreated (the primary key is patient + registry), so a row carrying a previous removal must have
 * those columns cleared unless this write is itself a removal.
 */
export const applyDeactivationFields = registrationData => {
  if (registrationData.registrationStatus === REGISTRATION_STATUSES.INACTIVE) {
    return {
      ...registrationData,
      deactivatedDate: registrationData.deactivatedDate || getCurrentDateTimeString(),
      deactivatedClinicianId: registrationData.clinicianId,
    };
  }

  return {
    ...registrationData,
    deactivatedDate: null,
    deactivatedClinicianId: null,
  };
};

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
