import React, { memo } from 'react';
import { Modal, ModalActions } from './Modal';
import { Button } from './Button';

export const Dialog = memo(
  ({
    dialogType = 'alert',
    headerTitle,
    contentText,
    isVisible,
    onClose,
    onConfirm,
    okText = 'OK',
    cancelText = 'Cancel',
  }) => (
    <Modal open={isVisible} onClose={onClose} title={headerTitle}>
      {contentText}
      <ModalActions>
        <React.Fragment>
          {dialogType === 'confirm' && (
            <Button variant="outlined" onClick={onClose}>
              {cancelText}
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={dialogType === 'confirm' ? onConfirm : onClose}
          >
            {okText}
          </Button>
        </React.Fragment>
      </ModalActions>
    </Modal>
  ),
);
