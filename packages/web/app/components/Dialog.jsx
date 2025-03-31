import React, { memo } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { ButtonRow } from './ButtonRow';

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
    >
      <>
        {contentText}
        <ButtonRow data-test-id='buttonrow-0mwy'>
          {dialogType === 'confirm' && (
            <Button variant="outlined" onClick={onClose} data-test-id='button-ceh4'>
              {cancelText}
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={dialogType === 'confirm' ? onConfirm : onClose}
            data-test-id='button-unnz'>
            {okText}
          </Button>
        </ButtonRow>
      </>
    </Modal>
  ),
);
