import * as yup from 'yup';
import { getCompleteRegistrationConditions } from '~/ui/helpers/programRegistration';

export const getRegistrationConditionsValidation = (
  mandatoryConditionEnabled: boolean,
  requiredMessage: string,
) =>
  yup
    .array()
    .of(
      yup.object().shape({
        condition: yup.object().shape({ value: yup.string().required() }),
        category: yup.object().shape({ value: yup.string().required() }),
      }),
    )
    .test(
      'mandatory-condition',
      requiredMessage,
      conditions =>
        !mandatoryConditionEnabled || getCompleteRegistrationConditions(conditions).length > 0,
    );
