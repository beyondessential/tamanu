import React, { Component } from 'react';
import Modal from 'react-responsive-modal';

import InputGroup from '../../../components/InputGroup';

class EditPhotoModal extends Component {
  render() {
    const { isVisible, onClose, editPhoto } = this.props;
    return (
      <Modal open={isVisible} onClose={onClose} little>
        <div className="tamanu-error-modal">
          <form
            onSubmit={e => {
              e.preventDefault();
              editPhoto();
            }}
          >
            <div className="modal-header">
              <h2>Edit Photo</h2>
            </div>
            <div className="modal-content">
              <InputGroup name="caption" label="Caption" />
              <div className="column">sdfsdfsdf</div>
            </div>
            <div className="modal-footer">
              <div className="column has-text-right">
                <button className="button is-danger" onClick={this.cancelAction}>
                  Cancel
                </button>
                <button className="button is-primary" type="submit">
                  Update
                </button>
              </div>
            </div>
          </form>
        </div>
      </Modal>
    );
  }
}

export default EditPhotoModal;
