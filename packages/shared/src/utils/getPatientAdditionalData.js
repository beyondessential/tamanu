import config from 'config';
import { getPatientSurveyResponseAnswer } from './getPatientSurveyResponseAnswer';

/**
 * Helper function to get patient additional data.
 *
 * Looks up selected field in AdditionalData records and
 * uses configured questionIds as a fallback
 *
 * The ideal way to get this data would be to allow survey questions to be configured
 * such that they write their answers to patient record fields (@see WAITM-104).
 * However in the meantime these endpoint handlers allow easy and consistent access to the data.
 */
export async function getPatientAdditionalData(models, patientId, fieldName) {
  const { PatientAdditionalData } = models;

  const patientAdditionalData = await PatientAdditionalData.findOne({
    where: { patientId },
    include: PatientAdditionalData.getFullReferenceAssociations(),
  });

  const value = patientAdditionalData?.dataValues[fieldName];

  if (value) {
    return value;
  }

  const questionId = config?.questionCodeIds[fieldName];
  return getPatientSurveyResponseAnswer(models, patientId, questionId);
}
