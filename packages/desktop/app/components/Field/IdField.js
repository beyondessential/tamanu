import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { Autorenew } from '@material-ui/icons';
import { Colors } from '../../constants';
import { InvertedDisplayIdLabel } from '../DisplayIdLabel';
import { TranslatedText } from '../Translation/TranslatedText';

const IdControl = styled.div`
  display: flex;
  color: ${Colors.primaryDark};
`;

const Id = styled(InvertedDisplayIdLabel)`
  display: block;
  font-weight: 600;
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
    color: ${Colors.primaryDark};
    padding: 0;
    margin-right: 5px;
  }
`;

const Text = styled.p`
  margin: 0;
  padding: 0;
  align-self: flex-end;
`;

export const IdInput = ({ value, name, onChange, regenerateId }) => (
  <IdControl>
    <Id data-test-class="id-field-div">{value || ''}</Id>
    <RegenerateId onClick={() => onChange({ target: { value: regenerateId(), name } })}>
      <Autorenew />
      <Text>
        <TranslatedText stringId="patient.form.id.regenerate" fallback="Regenerate" />
      </Text>
    </RegenerateId>
  </IdControl>
);

export const IdField = ({ field, regenerateId }) => (
  <IdInput
    name={field.name}
    value={field.value}
    onChange={field.onChange}
    regenerateId={regenerateId}
  />
);

IdInput.propTypes = {
  name: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
};

IdInput.defaultProps = {
  name: undefined,
  value: undefined,
  onChange: undefined,
};
