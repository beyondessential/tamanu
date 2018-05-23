import React, { Component } from 'react';
import Modal from 'react-responsive-modal';
import InputGroup from '../../../components/InputGroup';

class NewPhotoModal extends Component {
  render() {
    const {
      isVisible,
      onClose
    } = this.props;
    return (
      <Modal open={isVisible} onClose={onClose} little>
        <div className="tamanu-error-modal">
          <div className="modal-header">
            <h2>Add Photo</h2>
          </div>
          <div className="modal-content">
            <InputGroup
              name="caption"
              label="Caption"
            />
            <div className="column">
              <div>
                <span>
                  How do you want to add a Photo?
                </span>
              </div>
              <div className="select">
                <select>
                  <option>Take a picture</option>
                  <option>Upload a file</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <div className="column has-text-right">
              <button className="button is-danger" onClick={onClose}>Cancel</button>
              <button className="button is-primary" onClick={onClose}>Add</button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

export default NewPhotoModal;
