import * as yup from 'yup';
import { parseISO } from 'date-fns';

export const OPERATIONS = {
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
};

// allow either native date objects or ISO 8601 strings
const transformDate = (_, d) => {
  if (d instanceof Date) {
    return d;
  }
  if (d === null || d === undefined) {
    return d;
  }
  return parseISO(d);
};

export const remoteRequest = {
  patientCreated: yup
    .object({
      fetch_id: yup.string().required(),
      operation: yup
        .string()
        .required()
        .oneOf(Object.keys(OPERATIONS)),
      created_datetime: yup
        .date()
        .required()
        .transform(transformDate),
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
        fname: yup.string().nullable(),
        lname: yup.string().nullable(),
        dob: yup
          .date()
          .transform(transformDate)
          .nullable(),
        sex: yup
          .string()
          .required()
          .oneOf(['male', 'female', 'other'])
          .transform(g => g.toLowerCase()),
        sub_division: yup.string().nullable(),
        email: yup.string().nullable(),

        // PatientAdditionalData fields
        phone: yup.string().nullable(),

        // PatientVRSData fields
        id_type: yup.string().required(),
        identifier: yup.string().required(),
      })
      .required(),
  }),
  acknowledge: yup.object({
    response: yup
      .boolean()
      .required()
      .oneOf([true]),
  }),
  fetchAllPendingActions: yup.object({
    response: yup
      .string()
      .required()
      .oneOf(['success']),
    data: yup
      .array(
        yup
          .object({
            Id: yup.string().required(),
            Operation: yup
              .string()
              .required()
              .oneOf(Object.keys(OPERATIONS)),
            CreatedDateTime: yup
              .date()
              .required()
              .transform(transformDate),
          })
          .required(),
      )
      .required(),
  }),
};
