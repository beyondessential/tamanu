import React, { Component } from 'react';
import Modal from 'react-responsive-modal';

class DeletePhotoModal extends Component {
  render() {
    const {
      isVisible,
      onClose,
      deletePhoto,
    } = this.props;
    return (
      <Modal open={isVisible} onClose={onClose} little>
        <div className="tamanu-error-modal">
          <div className="modal-header">
            <h2>Delete Photo</h2>
          </div>
          <div className="modal-content">
            <div className="alert">
              <span>
                Are you sure you wish to delete?
              </span>
            </div>
          </div>
          <div className="modal-footer">
            <div className="column has-text-right">
              <button className="button is-danger cancel" onClick={onClose}>Cancel</button>
              <button className="button is-primary" onClick={deletePhoto}>Delete</button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

export default DeletePhotoModal;
