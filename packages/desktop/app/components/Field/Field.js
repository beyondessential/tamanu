import React from 'react';
import { Field as FormikField, connect as formikConnect, getIn } from 'formik';
import MuiBox from '@material-ui/core/Box';
import { FormTooltip } from '../FormTooltip';
import { TextField } from './TextField';
import { FORM_STATUSES } from '../../constants';

export const Field = formikConnect(
  ({ formik: { errors, status }, name, component = TextField, helperText, ...props }) => {
    // Only show error messages once the user has attempted to submit the form
    const error = status === FORM_STATUSES.SUBMIT_ATTEMPTED && !!getIn(errors, name);
    const message = error ? getIn(errors, name) : helperText;
    return (
      <FormikField
        {...props}
        component={component}
        error={error}
        helperText={message}
        name={name}
      />
    );
  },
);

/**
 * A formik form field with an added tooltip
 *
 * @param tooltipText - the text for the tooltip to show
 * @param muiTooltipProps - material ui tooltip props @see https://v4.mui.com/api/tooltip
 *
 */
export const FieldWithTooltip = ({ tooltipText, muiTooltipProps, ...props }) => (
  <MuiBox position="relative">
    <Field {...props} />
    <FormTooltip title={tooltipText} {...muiTooltipProps} />
  </MuiBox>
);
