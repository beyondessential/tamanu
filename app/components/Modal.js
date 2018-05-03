import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-responsive-modal';

class ModalView extends Component {
  static propTypes = {
    contentText: PropTypes.string.isRequired,
    isVisible: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
  }

  render() {
    const {
      contentText,
      isVisible,
      onClose
    } = this.props;
    return (
      <Modal open={isVisible} onClose={onClose} little>
        <div className="tamanu-error-modal">
          <div className="modal-header">
            <h2>Warning!!!!</h2>
          </div>
          <div className="modal-content">
            <span className="modal-text">{contentText}</span>
          </div>
          <div className="modal-footer">
            <div className="column has-text-right">
              <button className="button is-primary" onClick={onClose}>Ok</button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

export default ModalView;
