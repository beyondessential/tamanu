import * as yup from 'yup';

export const getRelatedConditionsSchema = (mandatoryConditionEnabled, requiredMessage) =>
  yup
    .array()
    .of(
      yup.object().shape({
        conditionId: yup.string().nullable(),
        conditionCategoryId: yup
          .string()
          .nullable()
          .when('conditionId', {
            is: Boolean,
            then: yup.string().required(requiredMessage),
          }),
      }),
    )
    .nullable()
    .test(
      'mandatory-condition',
      requiredMessage,
      (conditions, context) =>
        !mandatoryConditionEnabled ||
        Boolean(conditions?.some(condition => condition?.conditionId)) ||
        context.createError({ path: 'conditions[0].conditionId' }),
    );
