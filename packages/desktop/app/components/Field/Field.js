import React from 'react';
import {
  Field as FormikField,
  useField,
  connect as formikConnect,
  getIn,
  useFormikContext,
} from 'formik';
import MuiBox from '@material-ui/core/Box';
import { FormTooltip } from '../FormTooltip';
import { ThemedTooltip } from '../Tooltip';
import { TextField } from './TextField';
import { FORM_STATUSES } from '../../constants';

export const Field = formikConnect(
  ({
    formik: {
      errors,
      status: { submitStatus },
    },
    name,
    component = TextField,
    onChange,
    helperText,
    ...props
  }) => {
    // Only show error messages once the user has attempted to submit the form
    const error = submitStatus === FORM_STATUSES.SUBMIT_ATTEMPTED && !!getIn(errors, name);
    const message = error ? getIn(errors, name) : helperText;

    const { setFieldTouched } = useFormikContext();
    const [field] = useField(name);

    const baseOnChange = (...args) => {
      setFieldTouched(name, true);
      return field.onChange(...args);
    };

    const combinedOnChange = onChange
      ? (...args) => {
          onChange(...args);
          return baseOnChange(...args);
        }
      : baseOnChange;

    return (
      <FormikField
        {...props}
        component={component}
        error={error}
        helperText={message}
        name={name}
        onChange={combinedOnChange}
      />
    );
  },
);

/**
 * A formik form field with an added tooltip
 *
 * @param tooltipText - the text for the tooltip to show
 * @param disabledTooltipText = the text for the tooltip to show when the field is disabled
 * @param muiTooltipProps - material ui tooltip props @see https://v4.mui.com/api/tooltip
 *
 */
export const FieldWithTooltip = ({
  tooltipText,
  disabledTooltipText,
  muiTooltipProps,
  ...props
}) => (
  <MuiBox position="relative">
    {props.disabled ? (
      <ThemedTooltip
        title={disabledTooltipText || tooltipText}
        arrow
        placement="top"
        customCss="top: 30px !important;"
        {...props}
      >
        {/* Below div with transparent background color is needed to make ThemedTooltip work  */}
        <div style={{ backgroundColor: 'transparent' }}>
          <Field {...props} />
        </div>
      </ThemedTooltip>
    ) : (
      <>
        <Field {...props} />
        <FormTooltip title={tooltipText} {...muiTooltipProps} />
      </>
    )}
  </MuiBox>
);
