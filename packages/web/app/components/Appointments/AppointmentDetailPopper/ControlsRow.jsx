import React from 'react';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Close from '@mui/icons-material/Close';

import { FlexRow } from './SharedComponents';
import { MenuButton } from '../../MenuButton';
import { TranslatedText } from '../../Translation';

const ControlsContainer = styled(FlexRow)`
  position: fixed;
  inset-block-start: 0.5rem;
  inset-inline-end: 0.5rem;
  gap: 0.125rem;
`;

const StyledMenuButton = styled(MenuButton)`
  .MuiPaper-root {
    box-shadow: 0 0.5rem 2rem 0 oklch(0 0 0 / 15%);
    width: 3.625rem;
  }

  .MuiPopper-root {
    width: 3.625rem;
  }

  svg {
    font-size: 0.875rem;
  }
  #menu-list-grow {
    box-shadow: 0px 0.25rem 1rem 0px hsla(0, 0%, 0%, 0.1);
  }
`;

const StyledIconButton = styled(IconButton)`
  padding: 5px;
  svg {
    font-size: 0.875rem;
  }
`;

export const ControlsRow = ({ onClose, onCancel, onEdit }) => {
  const actions = [
    {
      label: <TranslatedText stringId="general.action.modify" fallback="Modify" />,
      action: onEdit,
    },
    {
      label: <TranslatedText stringId="general.action.cancel" fallback="Cancel" />,
      action: onCancel,
    },
  ];

  return (
    <ControlsContainer>
      <StyledMenuButton actions={actions} placement="bottom-start" />
      <StyledIconButton onClick={onClose}>
        <Close />
      </StyledIconButton>
    </ControlsContainer>
  );
};
