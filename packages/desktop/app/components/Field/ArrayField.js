import React from 'react';
import { FieldArray } from 'formik';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Grid, Typography, Chip } from '@material-ui/core';
import { NewButton, TextField, Field } from '../index';
import { MUI_SPACING_UNIT as spacing } from '../../constants';
import { Form } from './Form';

const ChipWithMargin = styled(Chip)`
  margin-right: ${spacing * 2}px;
`;

export const ArrayField = ({ field, ...props }) => (
  <ArrayInput
    {...field}
    {...props}
  />
);

export class ArrayInput extends React.PureComponent {

  render() {
    const { value, onChange, name, subform } = this.props;
    const valueItems = value || [];
    return (
      <div>
        <ul>
          { valueItems.map(x => <li>{JSON.stringify(x)}</li>) }
        </ul>
        <Form 
          key={valueItems.length}
          component="div"
          onSubmit={(newItem) => onChange({ 
            target: {
              name,
              value: [...valueItems, newItem] 
            }
          })}
          render={subform}
        />
      </div>
    );
  }
}

ArrayInput.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.arrayOf(PropTypes.any),
  label: PropTypes.string.isRequired,
  subform: PropTypes.func.isRequired,
  buttonLabel: PropTypes.string,
};

ArrayInput.defaultProps = {
  value: [],
  buttonLabel: 'Add',
};
