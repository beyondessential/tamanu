import React, { Component } from 'react';
import Modal from 'react-responsive-modal';
import InputGroup from '../../../components/InputGroup';

class NewNoteModal extends Component {
  render() {
    const {
      isVisible,
      onClose,
    } = this.props;
    return (
      <Modal open={isVisible} onClose={onClose} little>
        <div className="tamanu-error-modal">
          <div className="modal-header">
            <h2>New Note for</h2>
          </div>
          <div className="modal-content">
            <InputGroup
              name="note"
              label="Note"
              required
            />
            <InputGroup
              name="visit"
              label="Visit"
              required
            />
            <InputGroup
              name="behalf"
              label="On Behalf Of"
              required
            />
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

export default NewNoteModal;
