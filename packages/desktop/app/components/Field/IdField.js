import React from 'react';
import styled from 'styled-components';
import { PersonAdd } from '@material-ui/icons';
import { AutorenewIconButton } from '../../components';
import PropTypes from 'prop-types';

const IdFieldContainer = styled.div`
  background: #326699;
  padding: 33px;
  display: grid;
  grid-template-columns: 1fr 150px;
  grid-template-rows: 1fr 1fr;
`;

const IdFieldTitle = styled.div`
  color: #ffcc24;
  font-weight: 500;
  font-size: 18px;
`;

const IdDetails = styled.div`
  display: flex;
`;

const Id = styled.div`
  color: #2f4358;
  font-weight: 600;
  background: #ffcc24;
  border-radius: 4px;
  height: max-content;
  width: max-content;
  padding: 10px;
  margin-right: 15px;
`;

const RegenerateId = styled.div`
  color: #fff;
  padding: 10px;
  cursor: pointer;

  button {
    color: #fff;
    padding: 0;
    margin-right: 5px;
  }
`;

const AddUserIcon = styled.div`
  color: #2f4358;
  grid-column: 2 / 3;
  grid-row: 1 / 3;

  svg {
    height: 80px;
    width: 100px;
    float: right;
  }
`;

export const IdInput = ({ value, name, onChange, regenerateId }) => {
  return (
    <IdFieldContainer>
      <IdFieldTitle>Health Identification Number</IdFieldTitle>

      <IdDetails>
        <Id>{value || ''}</Id>
        <RegenerateId onClick={() => onChange({ target: { value: regenerateId(), name } })}>
          <AutorenewIconButton onClick={() => null} />
          Regenerate
        </RegenerateId>
      </IdDetails>

      <AddUserIcon>
        <PersonAdd />
      </AddUserIcon>
    </IdFieldContainer>
  );
};

export const IdField = ({ field, ...props }) => (
  <IdInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);

// TextInput.propTypes = {
//   name: PropTypes.string,
//   value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
//   onChange: PropTypes.func,
//   fullWidth: PropTypes.bool,
// };

// TextInput.defaultProps = {
//   value: '',
//   fullWidth: true,
// };
