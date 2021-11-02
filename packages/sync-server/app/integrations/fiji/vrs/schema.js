import * as yup from 'yup';
import { parseISO } from 'date-fns';

export const remoteRequest = {
  patientCreated: yup
    .object({
      fetch_id: yup.string().required(),
      operation: yup
        .string()
        .required()
        .oneOf(['INSERT']),
      created_datetime: yup
        .date()
        .required()
        .transform((_, d) => parseISO(d)),
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
        .oneOf(['bearer']),
    })
    .required(),
  fetchPatient: yup.object({
    response: yup
      .string()
      .required()
      .oneOf(['success']),
    data: yup
      .object({
        individual_refno: yup.number(),
        id_type: yup.string(),

        identifier: yup.string().required(),
        fname: yup.string().required(),
        lname: yup.string().required(),
        dob: yup
          .date()
          .required()
          .transform((_, d) => parseISO(d)),
        sex: yup
          .string()
          .required()
          .oneOf(['male', 'female', 'other'])
          .transform(g => g.toLowerCase()),
        sub_division: yup.string().required(),
        phone: yup.string().required(),
        email: yup.string().required(), // TODO: what does that "NULL" in the card mean?
      })
      .required(),
  }),
  acknowledge: yup.object({
    response: yup.bool().required(),
  }),
};
