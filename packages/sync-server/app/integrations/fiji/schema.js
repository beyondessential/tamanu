import * as yup from 'yup';
import { parseISO } from 'date-fns';

export const remoteRequest = {
  patientCreated: yup
    .object({
      fetch_id: yup.string().required(),
      operation: yup
        .string()
        .required()
        .equals('INSERT'),
      created_datetime: yup.string().required(),
    })
    .required(),
};

export const remoteResponse = {
  token: yup
    .object({
      access_token: yup.string().required(),
      expires_in: yup
        .number()
        .required()
        .integer(),
      token_type: yup
        .string()
        .required()
        .equals('bearer'),
    })
    .required(),
  fetchPatient: yup.object({
    individual_refno: yup.number(),
    id_type: yup.string(),

    identifier: yup.string().required(),
    fname: yup.string().required(),
    lname: yup.string().required(),
    dob: yup
      .date()
      .required()
      .transform(d => parseISO(d)),
    sex: yup
      .string()
      .required()
      .oneOf(['male', 'female', 'other'])
      .transform(g => g.toLowerCase()),
    sub_division: yup.string().required(),
    phone: yup.string().required(),
    email: yup.string().required(), // TODO: what does that "NULL" in the card mean?
  }),
};
