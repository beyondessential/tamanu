import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-responsive-modal';

class ModalView extends Component {
  static propTypes = {
    modalType: PropTypes.oneOf(['alert', 'confirm']),
    headerTitle: PropTypes.string.isRequired,
    contentText: PropTypes.string.isRequired,
    isVisible: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func,
    okText: PropTypes.string,
    cancelText: PropTypes.string,
  }

  static defaultProps = {
    modalType: 'alert',
    okText: 'OK',
    cancelText: 'Cancel',
    onConfirm: () => {}
  }

  render() {
    const {
      modalType,
      headerTitle,
      contentText,
      isVisible,
      onClose,
      onConfirm,
      okText,
      cancelText
    } = this.props;
    return (
      <Modal open={isVisible} onClose={onClose} little>
        <div className="tamanu-error-modal">
          <div className="modal-header">
            <h2>{headerTitle}</h2>
          </div>
          <div className="modal-content">
            <span className="modal-text">{contentText}</span>
          </div>
          <div className="modal-footer">
            <div className="column has-text-right">
              {modalType === 'confirm' && <button className="button is-default" onClick={onClose}>{cancelText}</button>}
              <button className="button is-primary" onClick={modalType === 'confirm' ? onConfirm : onClose}>{okText}</button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

export default ModalView;
