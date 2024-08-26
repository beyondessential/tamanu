import * as yup from 'yup';

export const questionCodeIdsDescription =
  'Avoid using questionCodeIds. The PatientData question type has made this setting redundant.';

export const questionCodeIdsSchema = yup.object({
  passport: yup.string(),
  nationalityId: yup.string(),
  email: yup.string().email(),
});
