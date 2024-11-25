import * as yup from 'yup';

export const questionCodeIdsDescription =
  'Avoid using questionCodeIds. The PatientData question type has made this setting redundant.';

export const passportSchema = yup.string().nullable();

export const nationalityIdSchema = yup.string().nullable();

export const emailSchema = yup.string().nullable();
