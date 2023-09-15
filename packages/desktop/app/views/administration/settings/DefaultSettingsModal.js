import React from 'react';
import styled from 'styled-components';
import { centralDefaults, globalDefaults, facilityDefaults } from '@tamanu/settings';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { Modal } from '../../../components/Modal';
import { JSONEditor } from './JSONEditor';

const SCOPE_DEFAULT_SETTINGS = {
  [SETTINGS_SCOPES.CENTRAL]: centralDefaults,
  [SETTINGS_SCOPES.GLOBAL]: globalDefaults,
  [SETTINGS_SCOPES.FACILITY]: facilityDefaults,
};

const Description = styled.div`
  font-size: 14px;
`;

export const DefaultSettingsModal = React.memo(({ scope, open, onClose }) => {
  const defaultSettingsObject = SCOPE_DEFAULT_SETTINGS[scope];
  return (
    <Modal open={open} onClose={onClose} width="lg" title={`Default ${scope} settings`}>
      <Description>
        These are the fallback values for keys not defined in {scope} settings
      </Description>
      <JSONEditor value={JSON.stringify(defaultSettingsObject, null, 2)} editMode={false} />
    </Modal>
  );
});
