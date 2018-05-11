import React, { Component } from 'react';
import Modal from 'react-responsive-modal';
import InputGroup from '../../../components/InputGroup';

class AddContactModal extends Component {
  render() {
    const {
      isVisible,
      onClose
    } = this.props;
    return (
      <Modal open={isVisible} onClose={onClose} little>
        <div className="tamanu-error-modal">
          <div className="modal-header">
            <h2>Add Contact</h2>
          </div>
          <div className="modal-content">
            <InputGroup
              name="name"
              label="Name"
            />
            <InputGroup
              name="phone"
              label="Phone"
            />
            <InputGroup
              name="email"
              label="Email"
            />
            <InputGroup
              name="relationships"
              label="Relationships"
            />
          </div>
          <div className="modal-footer">
            <div className="column has-text-right">
              <button className="button is-danger cancel" onClick={onClose}>Cancel</button>
              <button className="button is-primary" onClick={onClose}>Ok</button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

export default AddContactModal;
