import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog as MuiDialog, DialogTitle, DialogContent, DialogActions,
} from '@material-ui/core';
import { MUI_SPACING_UNIT as spacing } from '../constants';

export const ModalActions = (props) => (
  <DialogActions style={{ marginTop: spacing * 2 }} {...props} />
);

export function Modal({
  title, children, isVisible,
  onClose, actions, ...props
}) {
  return (
    <MuiDialog
      fullWidth
      maxWidth="sm"
      {...props}
      open={isVisible}
      onClose={onClose}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      {actions && <ModalActions>{actions}</ModalActions>}
    </MuiDialog>
  );
}

Modal.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  actions: PropTypes.node,
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

Modal.defaultProps = {
  actions: null,
};
