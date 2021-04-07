import * as Yup from 'yup';

export const signInValidationSchema = Yup.object().shape({
  email: Yup.string()
    .email(),
  // .required(),
  password: Yup.string(), //.required(),
  server: Yup.string(),
});
export const signInInitialValues = {
  email: '',
  password: '',
  server: '',
};
