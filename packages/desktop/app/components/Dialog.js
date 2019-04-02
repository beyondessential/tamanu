import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from './Modal';
import { Button } from './Button';

export function Dialog({
  dialogType, headerTitle, contentText, isVisible,
  onClose, onConfirm, okText, cancelText,
}) {
  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title={headerTitle}
      actions={(
        <React.Fragment>
          {dialogType === 'confirm' && <Button variant="outlined" onClick={onClose}>{cancelText}</Button>}
          <Button
            variant="contained"
            color="primary"
            onClick={dialogType === 'confirm' ? onConfirm : onClose}
          >
            {okText}
          </Button>
        </React.Fragment>
      )}
    >
      {contentText}
    </Modal>
  );
}

Dialog.propTypes = {
  dialogType: PropTypes.oneOf(['alert', 'confirm']),
  headerTitle: PropTypes.string.isRequired,
  contentText: PropTypes.string.isRequired,
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func,
  okText: PropTypes.string,
  cancelText: PropTypes.string,
};

Dialog.defaultProps = {
  dialogType: 'alert',
  okText: 'OK',
  cancelText: 'Cancel',
  onConfirm: () => {},
};
