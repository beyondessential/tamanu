// Copied from Tupaia

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Divider as BaseDivider } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import BaseDeleteOutlinedIcon from '@material-ui/icons/DeleteOutlined';
import { SUGGESTER_ENDPOINTS } from '@tamanu/constants';
import {
  TextField,
  DefaultIconButton,
  SelectField,
  ArrayField,
  Field,
  OuterLabelFieldWrapper,
} from '../../../../../components';
import {
  PARAMETER_FIELD_COMPONENTS,
  FIELD_TYPES_WITH_SUGGESTERS,
  FIELD_TYPES_WITH_PREDEFINED_OPTIONS,
} from '../../../../reports/ParameterField';

const Divider = styled(BaseDivider)`
  margin-top: 20px;
  margin-bottom: 20px;
`;

const IconButton = styled(DefaultIconButton)`
  top: 35px;
  width: 30%;
  height: 20px;
`;
const DeleteOutlinedIcon = styled(BaseDeleteOutlinedIcon)`
  font-size: 25px;
`;

const DeleteContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 35px;
  button {
    padding: 0;
  }
`;

export const ParameterItem = props => {
  const {
    id,
    name,
    label,
    parameterField,
    suggesterEndpoint,
    onDelete,
    onChange,
    options = [],
  } = props;

  const onChangeOptions = (index, type, event) => {
    if (options[index] === undefined) {
      options[index] = {};
    }
    options[index][type] = event.target.value;
    onChange(id, `options`, [...options]);
  };

  return (
    <Grid container spacing={2} key={id}>
      <Grid item xs={6}>
        <TextField
          field={{
            name: 'name',
            value: name,
            onChange: event => {
              onChange(id, 'name', event.target.value);
            },
          }}
          placeholder="Text"
          label="Name"
        />
      </Grid>
      <Grid item xs={5}>
        <TextField
          field={{
            name: 'label',
            value: label,
            onChange: event => {
              onChange(id, 'label', event.target.value);
            },
          }}
          placeholder="Text"
          label="Label"
        />
      </Grid>
      <Grid item xs={1}>
        <IconButton variant="text" onClick={() => onDelete(id)}>
          <DeleteOutlinedIcon />
        </IconButton>
      </Grid>
      <Grid item xs={11}>
        <SelectField
          field={{
            name: 'parameterField',
            value: parameterField,
            onChange: event => {
              onChange(id, 'parameterField', event.target.value);
            },
          }}
          placeholder="Text"
          label="Field type"
          options={Object.keys(PARAMETER_FIELD_COMPONENTS).map(key => ({
            label: key,
            value: key,
          }))}
        />
      </Grid>
      {FIELD_TYPES_WITH_SUGGESTERS.includes(parameterField) && (
        <Grid item xs={11}>
          <SelectField
            field={{
              name: 'suggesterEndpoint',
              value: suggesterEndpoint,
              onChange: event => {
                onChange(id, 'suggesterEndpoint', event.target.value);
              },
            }}
            placeholder="Text"
            label="Suggester endpoint"
            options={SUGGESTER_ENDPOINTS.sort((a, b) => a.localeCompare(b)).map(key => ({
              label: key,
              value: key,
            }))}
          />
        </Grid>
      )}
      {FIELD_TYPES_WITH_PREDEFINED_OPTIONS.includes(parameterField) && (
        <>
          <Grid item xs={12}>
            <OuterLabelFieldWrapper label="Options" />
          </Grid>
          <Field
            name="options"
            component={ArrayField}
            initialFieldNumber={options.length}
            renderField={(index, DeleteButton) => (
              <>
                <Grid item xs={6}>
                  <Field
                    name={`options[${index}].label`}
                    label="Label"
                    component={TextField}
                    value={options[index]?.label}
                    onChange={event => {
                      onChangeOptions(index, 'label', event);
                    }}
                  />
                </Grid>
                <Grid item xs={5}>
                  <Field
                    name={`options[${index}].value`}
                    label="Value"
                    component={TextField}
                    value={options[index]?.value}
                    onChange={event => {
                      onChangeOptions(index, 'value', event);
                    }}
                  />
                </Grid>
                <Grid item xs={1}>
                  <DeleteContainer>{index > 0 && DeleteButton}</DeleteContainer>
                </Grid>
              </>
            )}
          />
        </>
      )}
      <Grid item xs={12}>
        <Divider />
      </Grid>
    </Grid>
  );
};

ParameterItem.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string,
  parameterField: PropTypes.string,
  suggesterEndpoint: PropTypes.string,
  onDelete: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
};

ParameterItem.defaultProps = {
  name: '',
  parameterField: '',
  suggesterEndpoint: '',
};
