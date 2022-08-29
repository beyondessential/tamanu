import * as yup from 'yup';
import { BIRTH_DELIVERY_TYPES, BIRTH_TYPES, PLACE_OF_BIRTH_TYPES } from 'shared/constants';

export const getPatientDetailsValidation = sexValues => {
  return yup.object().shape({
    firstName: yup.string().required(),
    middleName: yup.string(),
    lastName: yup.string().required(),
    culturalName: yup.string(),
    dateOfBirth: yup.date().required(),
    sex: yup
      .string()
      .oneOf(sexValues)
      .required(),
    email: yup.string().email(),
    religion: yup.string(),
    occupation: yup.string(),
    birthWeight: yup
      .number()
      .min(0)
      .max(6),
    birthLength: yup
      .number()
      .min(0)
      .max(50),
    birthDeliveryType: yup.string().oneOf(Object.values(BIRTH_DELIVERY_TYPES)),
    gestationalAgeEstimate: yup
      .number()
      .min(1)
      .max(45),
    apgarScoreOneMinute: yup
      .number()
      .min(1)
      .max(10),
    apgarScoreFiveMinutes: yup
      .number()
      .min(1)
      .max(10),
    apgarScoreTenMinutes: yup
      .number()
      .min(1)
      .max(10),
    birthType: yup.string().oneOf(Object.values(BIRTH_TYPES)),
    timeOfBirth: yup.string(),
    registeredBirthPlace: yup.string().oneOf(Object.values(PLACE_OF_BIRTH_TYPES)),
  });
};
