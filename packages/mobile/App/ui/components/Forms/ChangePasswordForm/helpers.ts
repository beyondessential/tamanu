import * as Yup from 'yup';

export const changePasswordValidationSchema = Yup.object().shape({
  email: Yup.string().email(),
  token: Yup.string(),
  newPassword: Yup.string().min(5),
  server: Yup.string(),
});
export const changePasswordInitialValues = {
  email: '',
  token: '',
  newPassword: '',
  server: '',
};