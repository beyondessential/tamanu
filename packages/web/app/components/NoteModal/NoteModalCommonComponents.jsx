import React from 'react';
import { DialogTitle, Box, IconButton, DialogContent, DialogActions } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import styled from 'styled-components';
import { FormGrid } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';


const StyledTitleContents = styled(Box)`
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;
  padding: 4px 19px;
  font-size: 14px;
`;

export const NoteModalDialogTitle = ({ title, onClose }) => {
  return (
    <DialogTitle style={{ borderBottom: `1px solid ${Colors.softOutline}`, padding: 0 }}>
      <StyledTitleContents>
        {title}
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </StyledTitleContents>
    </DialogTitle>
  );
};

export const NoteModalDialogContent = styled(DialogContent)`
  min-height: 300px;
  padding-bottom: 0px;
  display: flex;
  flex-direction: column;
`;

export const NoteModalDialogActions = styled(DialogActions)`
  padding: 10px 20px;
  background: none;
  border-top: 1px solid ${Colors.softOutline};
  position: sticky;
  bottom: 0;
`;

/* Ensures that wrapped inputs show a specific background color, rather than just inheriting */
export const DisabledWrapper = styled.div`
  & .MuiInputBase-root.Mui-disabled {
    background-color: ${props => props.color || 'inherit'} !important;
  }
`;

export const NoteModalFormGrid = styled(FormGrid)`
  margin-block: 0;
  padding-block: 0;
`;
