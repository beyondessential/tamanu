import React, { Component } from 'react';
import Modal from 'react-responsive-modal';
import InputGroup from '../../../components/InputGroup';

class AddAllergyModal extends Component {
  render() {
    const {
      isVisible,
      onClose
    } = this.props;
    return (
      <Modal open={isVisible} onClose={onClose} little>
        <div className="tamanu-error-modal">
          <div className="modal-header">
            <h2>Add Allergy</h2>
          </div>
          <div className="modal-content">
            <InputGroup
              name="name"
              label="Name"
              required
            />
          </div>
          <div className="modal-footer">
            <div className="column has-text-right">
              <button className="button is-primary" onClick={onClose}>Add</button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

export default AddAllergyModal;
