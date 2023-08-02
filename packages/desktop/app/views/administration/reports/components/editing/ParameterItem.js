// Copied from Tupaia

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Divider as BaseDivider } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import BaseDeleteOutlinedIcon from '@material-ui/icons/DeleteOutlined';
import { TextField, DefaultIconButton } from '../../../../../components';

const Divider = styled(BaseDivider)`
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

export const ParameterItem = props => {
  const { id, name, label, parameterField, suggesterEndpoint, onDelete, onChange } = props;

  return (
    <Grid container spacing={0} key={id}>
      <Grid container spacing={2}>
        <Grid item xs={5}>
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
      </Grid>
      <Grid item xs={10}>
        <Grid item xs={5}>
          <TextField
            field={{
              name: 'parameterField',
              value: parameterField,
              onChange: event => {
                onChange(id, 'parameterField', event.target.value);
              },
            }}
            placeholder="Text"
            label="Parameter field"
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            field={{
              name: 'suggesterEndpoint',
              value: suggesterEndpoint,
              onChange: event => {
                onChange(id, 'suggesterEndpoint', event.target.value);
              },
            }}
            placeholder="Text"
            label="Suggester endpoint"
          />
        </Grid>
        <Grid item xs={1}>
          <IconButton variant="text" onClick={() => onDelete(id)}>
            <DeleteOutlinedIcon />
          </IconButton>
        </Grid>
      </Grid>
      <Grid item xs={10}>
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
