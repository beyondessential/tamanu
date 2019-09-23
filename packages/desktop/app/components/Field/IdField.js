import React from 'react';
import styled from 'styled-components';
import { Autorenew } from '@material-ui/icons';
import PropTypes from 'prop-types';

const IdControl = styled.div`
  display: flex;
  color: #2f4358;
`;

const Id = styled.div`
  font-weight: 600;
  background: #ffcc24;
  border-radius: 4px;
  height: max-content;
  width: max-content;
  padding: 10px;
  margin-right: 15px;
`;

const RegenerateId = styled.div`
  display: flex;
  padding: 10px;
  cursor: pointer;

  svg {
    color: #2f4358;
    padding: 0;
    margin-right: 5px;
  }
`;

const Text = styled.p`
  margin: 0;
  padding: 0;
  align-self: flex-end;
`;

export const IdInput = ({ value, name, onChange, regenerateId }) => {
  return (
    <IdControl>
      <Id>{value || ''}</Id>
      <RegenerateId onClick={() => onChange({ target: { value: regenerateId(), name } })}>
        <Autorenew />
        <Text>Regenerate</Text>
      </RegenerateId>
    </IdControl>
  );
};

export const IdField = props => (
  <IdInput
    name={props.field.name}
    value={props.field.value}
    onChange={props.field.onChange}
    {...props}
  />
);

IdInput.propTypes = {
  name: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
};
