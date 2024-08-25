import * as yup from 'yup';

export const questionCodeIdsSchema = yup.object({
  passport: yup.string(),
  nationalityId: yup.string(),
  email: yup.string().email(),
});
