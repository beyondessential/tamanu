import * as Yup from 'yup';

export const resetPasswordValidationSchema = Yup.object().shape({
  email: Yup.string()
    .email(),
  server: Yup.string(),
});
export const resetPasswordInitialValues = {
  email: '',
  server: '',
};
