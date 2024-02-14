import React, { useEffect } from 'react';
import {
  connect as formikConnect,
  Field as FormikField,
  getIn,
  useField,
  useFormikContext,
} from 'formik';
import MuiBox from '@material-ui/core/Box';
import styled from 'styled-components';
import { ThemedTooltip } from '../Tooltip';
import { TextField } from './TextField';
import { FORM_STATUSES } from '../../constants';
import { FormTooltip } from '../FormTooltip';

export const Field = formikConnect(
  ({
    formik: {
      errors,
      status: { submitStatus },
      setFieldValue,
      initialValues,
    },
    name,
    defaultValue,
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

    useEffect(() => {
      console.log(component.name)
      if (initialValues[name] || !defaultValue) return
      setFieldValue(name, defaultValue);
    },[defaultValue, initialValues, name, setFieldValue])

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
const StyledToolTip = styled(ThemedTooltip)`
  .MuiTooltip-tooltip {
    top: 30px !important;
    font-weight: 400;
    text-align: center;
  }
`;
export const FieldWithTooltip = ({
  tooltipText,
  disabledTooltipText,
  muiTooltipProps,
  ...props
}) => {
  if (disabledTooltipText && props.disabled)
    return (
      <MuiBox position="relative">
        <StyledToolTip title={disabledTooltipText} arrow placement="top" {...props}>
          {/* Below div is needed to make StyledToolTip work  */}
          <div>
            <Field {...props} />
          </div>
        </StyledToolTip>
      </MuiBox>
    );

  return (
    <MuiBox position="relative">
      <Field {...props} />
      {tooltipText && <FormTooltip title={tooltipText} {...muiTooltipProps} />}
    </MuiBox>
  );
};
