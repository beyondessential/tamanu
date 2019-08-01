import React, { Component } from 'react';
import Modal from 'react-responsive-modal';
import Dropzone from 'react-dropzone';
import _ from 'lodash';

import Serializer from '../../../utils/form-serialize';
import InputGroup from '../../../components/InputGroup';

class NewPhotoModal extends Component {
  state = {
    selectedOption: 'take',
    selectedFile: null,
  };

  optionChange = value => {
    this.setState({ selectedOption: value });
  };

  onDrop = files => {
    this.setState({ selectedFile: files[0] });
  };

  cancelAction = () => {
    this.setState({ selectedFile: null });
    this.props.onClose();
  };

  render() {
    const { selectedOption, selectedFile } = this.state;
    const { isVisible, onClose, addPhoto } = this.props;
    const that = this;
    return (
      <Modal open={isVisible} onClose={onClose} little>
        <div className="tamanu-error-modal">
          <form
            onSubmit={e => {
              e.preventDefault();
              const photo = Serializer.serialize(e.target, { hash: true });
              const result = {};
              _.extend(result, photo, selectedFile);
              if (selectedFile) {
                addPhoto(result);
                this.setState({ selectedFile: null });
              }
            }}
          >
            <div className="modal-header">
              <h2>Add Photo</h2>
            </div>
            <div className="modal-content">
              <InputGroup name="caption" label="Caption" />
              <div className="column">
                <div>
                  <span>How do you want to add a Photo?</span>
                </div>
                <div className="select">
                  <select onChange={e => that.setState({ selectedOption: e.target.value })}>
                    <option value="take">Take a picture</option>
                    <option value="upload">Upload a file</option>
                  </select>
                </div>
              </div>
              <div className="column">
                {selectedOption === 'take' ? (
                  <div>
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
                  </div>
                ) : (
                  <div>
                    <span>Upload file</span>
                    <div className="column">
                      <Dropzone
                        className="upload-panel columns"
                        onDrop={this.onDrop}
                        multiple={false}
                        accept="image/jpeg, image/png"
                      >
                        <button className="button">Choose File</button>
                        <span>{selectedFile === null ? 'No File chosen' : selectedFile.name}</span>
                      </Dropzone>
                    </div>
                    <div>
                      {selectedFile === null && (
                        <div className="attention">
                          Please take a picture or upload a file before saving this photo.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <div className="column has-text-right">
                <button className="button is-danger" onClick={this.cancelAction}>
                  Cancel
                </button>
                <button className="button is-primary" type="submit">
                  Add
                </button>
              </div>
            </div>
          </form>
        </div>
      </Modal>
    );
  }
}

export default NewPhotoModal;
