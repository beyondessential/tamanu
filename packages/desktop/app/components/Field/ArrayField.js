import React from 'react';
import { FieldArray } from 'formik';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Grid, Typography, Chip } from '@material-ui/core';
import { NewButton, TextField, Field } from '../index';
import { MUI_SPACING_UNIT as spacing } from '../../constants';

const ChipWithMargin = styled(Chip)`
  margin-right: ${spacing * 2}px;
`;

export const ArrayField = ({ field, ...props }) => (
  <ArrayInput
    {...field}
    {...props}
  />
);

export const ArrayInput = ({
  name,
  value: valueArray,
  label,
  form: { values, setFieldValue },
  buttonLabel = 'Add',
}) => (
  <FieldArray
    name={name}
    render={({ push, remove }) => (
      <Grid
        container
        spacing={spacing * 2}
        style={{ marginBottom: spacing * 2 }}
      >
        <Grid container item spacing={spacing * 2}>
          <Grid item md={8} xs>
            <Field
              component={TextField}
              name="fieldArrayValue"
              label="Action"
            />
          </Grid>
          <Grid container item md={4} alignItems="flex-end">
            <NewButton
              disabled={!values.fieldArrayValue}
              size="small"
              onClick={() => {
                push(values.fieldArrayValue);
                setFieldValue('fieldArrayValue', null);
              }}
            >
              {buttonLabel}
            </NewButton>
          </Grid>
        </Grid>


        {valueArray && valueArray.length > 0
          && (
            <Grid
              container
              item
              spacing={spacing * 2}
              direction="column"
            >
              <Grid item>
                <Typography variant="subtitle1">
                  {label}
                </Typography>
              </Grid>
              <Grid item>
                {valueArray.map((value, index) => (
                  <ChipWithMargin
                    key={value}
                    label={value}
                    onDelete={() => remove(index)}
                  />
                ))}
              </Grid>
            </Grid>
          )
        }
      </Grid>
    )}
  />
);

ArrayInput.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.arrayOf(PropTypes.string),
  label: PropTypes.string.isRequired,
  buttonLabel: PropTypes.string,
};

ArrayInput.defaultProps = {
  value: [],
  buttonLabel: 'Add',
};
