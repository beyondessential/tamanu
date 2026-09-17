import React from 'react';
import styled from 'styled-components';

import { SETTINGS_SCOPES } from '@tamanu/constants';
import { centralDefaults, globalDefaults, facilityDefaults } from '@tamanu/settings/schema';

import { Modal } from '../../../../components/Modal';
import { JSONEditor } from '@tamanu/ui-components';

const SCOPE_DEFAULT_SETTINGS = {
  [SETTINGS_SCOPES.CENTRAL]: centralDefaults,
  [SETTINGS_SCOPES.GLOBAL]: globalDefaults,
  [SETTINGS_SCOPES.FACILITY]: facilityDefaults,
};

const StyledModal = styled(Modal)`
  .MuiPaper-root {
    height: 100%;
    display: flex;
    flex-direction: column;
    // Everything below the fixed-height modal header fills the remaining space so the
    // JSON editor grows to the full modal height. The header is a <header> element, not
    // a .MuiDialogTitle-root direct child, so it must be excluded by tag.
    > :not(header) {
      flex: 1;
      display: flex;
      flex-direction: column;
      > :not(.MuiDialogActions-root) {
        display: flex;
        flex-direction: column;
      }
    }
  }
`;

const Description = styled.div`
  font-size: 14px;
  margin-bottom: 18px;
`;

export const DefaultSettingsModal = React.memo(({ scope, open, onClose }) => {
  const defaultSettingsForScope = JSON.stringify(SCOPE_DEFAULT_SETTINGS[scope], null, 2);
  return (
    <StyledModal
      open={open}
      onClose={onClose}
      width="lg"
      title={`Default ${scope} settings`}
      data-testid="styledmodal-f4p5"
    >
      <Description data-testid="description-rsez">
        These are the fallback values for keys not defined in {scope} settings
      </Description>
      <JSONEditor value={defaultSettingsForScope} editMode={false} data-testid="jsoneditor-cy0m" />
    </StyledModal>
  );
});
