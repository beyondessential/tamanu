import React from 'react';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Close from '@mui/icons-material/Close';

import { MenuButton } from '../../MenuButton';
import { TranslatedText } from '../../Translation';
import { useAuth } from '../../../contexts/Auth';

const ControlsContainer = styled('div')`
  z-index: 1;
  display: flex;
  flex-direction: row;
  gap: 0.125rem;
  inset-block-start: 0.5rem;
  inset-inline-end: 0.5rem;
  position: fixed;
`;

const StyledMenuButton = styled(MenuButton)`
  .MuiPaper-root {
    box-shadow: 0 0.5rem 2rem 0 oklch(0 0 0 / 15%);
  }

  .MuiPopper-root {
    width: 3.625rem;
  }

  svg {
    font-size: 0.875rem;
  }

  #menu-list-grow {
    box-shadow: 0 0.25rem 1rem 0 oklch(0 0 0 / 10%);
  }
`;

const StyledIconButton = styled(IconButton)`
  padding: 5px;
  svg {
    font-size: 0.875rem;
  }
`;

export const ControlsRow = ({ onClose, onCancel, onEdit, additionalActions = [] }) => {
  const { ability } = useAuth();
  const canWriteAppointment = ability.can('write', 'Appointment');

  const actions = [
    {
      label: (
        <TranslatedText
          stringId="general.action.modify"
          fallback="Modify"
          data-testid="translatedtext-5996"
        />
      ),
      action: onEdit,
    },
    {
      label: (
        <TranslatedText
          stringId="general.action.cancel"
          fallback="Cancel"
          data-testid="translatedtext-vb4b"
        />
      ),
      action: onCancel,
    },
    ...additionalActions,
  ];

  return (
    <ControlsContainer data-testid="controlscontainer-5uec">
      {canWriteAppointment && (
        <StyledMenuButton
          actions={actions}
          placement="bottom-start"
          data-testid="styledmenubutton-5ofi"
        />
      )}
      <StyledIconButton onClick={onClose} data-testid="stylediconbutton-5htw">
        <Close data-testid="close-j8rj" />
      </StyledIconButton>
    </ControlsContainer>
  );
};
