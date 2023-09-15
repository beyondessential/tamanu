import React from 'react';
import { centralDefaults, globalDefaults, facilityDefaults } from '@tamanu/settings';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { Modal } from '../../../components/Modal';
import { JSONEditor } from './JSONEditor';

const SCOPE_DEFAULT_SETTINGS = {
  [SETTINGS_SCOPES.CENTRAL]: centralDefaults,
  [SETTINGS_SCOPES.GLOBAL]: globalDefaults,
  [SETTINGS_SCOPES.FACILITY]: facilityDefaults,
};

export const DefaultSettingsModal = React.memo(({ scope, open, onClose }) => {
  const defaultSettingsObject = SCOPE_DEFAULT_SETTINGS[scope];
  return (
    <Modal open={open} onClose={onClose} width="lg" title={`Default ${scope} settings`}>
      <JSONEditor value={JSON.stringify(defaultSettingsObject, null, 2)} editMode={false} />
    </Modal>
  );
});
