import React, { memo } from 'react';
import { Modal } from './Modal';
import { ButtonRow, Button } from './Button';

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
    disableDevWarning = false,
  }) => (
    <Modal
      open={isVisible}
      onClose={onClose}
      title={headerTitle}
      disableDevWarning={disableDevWarning}
      data-testid="modal-c0np"
    >
      <>
        {contentText}
        <ButtonRow data-testid="buttonrow-dlvl">
          {dialogType === 'confirm' && (
            <Button variant="outlined" onClick={onClose} data-testid="button-qjdf">
              {cancelText}
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={dialogType === 'confirm' ? onConfirm : onClose}
            data-testid="button-ui1m"
          >
            {okText}
          </Button>
        </ButtonRow>
      </>
    </Modal>
  ),
);
