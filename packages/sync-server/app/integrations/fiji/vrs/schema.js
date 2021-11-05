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
        // Patient fields
        individual_refno: yup.string().required(),
        fname: yup.string(),
        lname: yup.string(),
        dob: yup.date().transform((_, d) => parseISO(d)),
        sex: yup
          .string()
          .required()
          .oneOf(['male', 'female', 'other'])
          .transform(g => g.toLowerCase()),
        sub_division: yup.string(),
        email: yup.string(),

        // PatientAdditionalData fields
        phone: yup.string(),

        // PatientVRSData fields
        id_type: yup.string(),
        identifier: yup.string(),
      })
      .required(),
  }),
  acknowledge: yup.object({
    response: yup.bool().required(),
  }),
};
