import React from 'react';
import { Field as FormikField, connect as formikConnect, getIn } from 'formik';
import MuiBox from '@material-ui/core/Box';
import { FormTooltip } from '../FormTooltip';
import { TextField } from './TextField';

export const Field = formikConnect(
  ({ formik: { errors }, name, component = TextField, helperText, ...props }) => (
    <FormikField
      {...props}
      component={component}
      error={!!getIn(errors, name)}
      helperText={getIn(errors, name) || helperText}
      name={name}
    />
  ),
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
