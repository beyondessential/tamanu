import React, { Component } from 'react';
import Modal from 'react-responsive-modal';
import InputGroup from '../../../components/InputGroup';

class NewPhotoModal extends Component {
  state = {
    selectedOption: 'take'
  }

  optionChange = (value) => {
    console.log('value', value);
    this.setState({ selectedOption: value });
  }

  render() {
    const { selectedOption } = this.state;
    const {
      isVisible,
      onClose
    } = this.props;
    console.log('selectedOption', selectedOption);
    const that = this;
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
                <select onChange={(e) => that.setState({ selectedOption: e.target.value })}>
                  <option value="take">Take a picture</option>
                  <option value="upload">Upload a file</option>
                </select>
              </div>
            </div>
            <div className="column">
              {selectedOption === 'take' ?
                <div className="column">
                  <div className="take-panel columns">
                    <div className="column">
                      <span>Preview</span>
                    </div>
                    <div className="column">
                      <span>Photo</span>
                    </div>
                    <button className="button take-button">Take photo</button>
                  </div>
                </div>
              :
                <div>
                  <span>
                    Upload file
                  </span>
                  <div className="column">
                    <div className="upload-panel columns">
                      <input type="file" />
                    </div>
                  </div>
                </div>
              }
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
