import React, { useEffect, useRef } from 'react';
import { SUBMIT_ATTEMPTED_STATUS } from '@tamanu/constants/forms';
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
import { FormTooltip } from '../FormTooltip';

export const Field = formikConnect(
  ({
    formik: {
      errors,
      status: { submitStatus },
      validateField,
      values,
    },
    name,
    component = TextField,
    onChange,
    helperText,
    ...props
  }) => {
    // Only show error messages once the user has attempted to submit the form
    const error = submitStatus === SUBMIT_ATTEMPTED_STATUS && !!getIn(errors, name);
    const message = error ? getIn(errors, name) : helperText;

    const { setFieldTouched } = useFormikContext();
    const [field] = useField(name);
    const fieldValue = getIn(values, name);

    const isFormSubmitted = useRef(false);

    // Set a flag to indicate that the form has been submitted
    useEffect(() => {
      if (submitStatus === SUBMIT_ATTEMPTED_STATUS) {
        setTimeout(() => {
          isFormSubmitted.current = true;
        });
      }
    }, [submitStatus]);

    // Validate field when its value changes (only after submit attempt and if there is an error)
    useEffect(() => {
      if (error && isFormSubmitted.current) {
        validateField(name);
      }
    }, [error, fieldValue, name, validateField]);

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
const StyledToolTip = styled(ThemedTooltip)`
  .MuiTooltip-tooltip {
    top: 30px !important;
    font-weight: 400;
    text-align: center;
  }
`;
export const FieldWithTooltip = ({
  $tooltipText,
  disabledTooltipText,
  muiTooltipProps,
  ...props
}) => {
  if (disabledTooltipText && props.disabled)
    return (
      <MuiBox position="relative" data-testid="muibox-slpq">
        <StyledToolTip
          title={disabledTooltipText}
          arrow
          placement="top"
          {...props}
          data-testid="styledtooltip-qc9k"
        >
          {/* Below div is needed to make StyledToolTip work  */}
          <div>
            <Field {...props} data-testid="field-ete4" />
          </div>
        </StyledToolTip>
      </MuiBox>
    );

  return (
    <MuiBox position="relative" data-testid="muibox-8z4o">
      <Field {...props} data-testid="field-tybt" />
      {$tooltipText && (
        <FormTooltip
          arrow
          placement="top"
          title={$tooltipText}
          {...muiTooltipProps}
          data-testid="formtooltip-lztn"
        />
      )}
    </MuiBox>
  );
};
