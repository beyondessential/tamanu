import React, { Component } from 'react';
import NewPhotoModal from '../components/NewPhotoModal';
import EditPhotoModal from '../components/EditPhotoModal';
import DeletePhotoModal from '../components/DeletePhotoModal';

class Photos extends Component {
  state = {
    photos: [],
    addPhotoModalVisible: false,
    editPhotoModalVisible: false,
    deletePhotoModalVisible: false,
  }

  addPhoto = (file) => {
    this.setState({ addPhotoModalVisible: false });
    const { photos } = this.state;
    const selectedFiles = photos;
    selectedFiles.push(file);
    this.setState({
      photos: selectedFiles,
    });
  }

  editPhoto = () => {
    this.setState({ editPhotoModalVisible: false });
  }

  deletePhoto = () => {
    this.setState({ deletePhotoModalVisible: false });
  }

  onCloseAddModal = () => {
    this.setState({ addPhotoModalVisible: false });
  }

  onCloseEditModal = () => {
    this.setState({ editPhotoModalVisible: false });
  }

  onCloseDeleteModal = () => {
    this.setState({ deletePhotoModalVisible: false });
  }

  render() {
    const {
      photos,
      addPhotoModalVisible,
      editPhotoModalVisible,
      deletePhotoModalVisible
    } = this.state;
    return (
      <div>
        <div className="column has-text-right">
          <button className="button is-primary" onClick={() => this.setState({ addPhotoModalVisible: true })}>+ New Photo</button>
        </div>
        <div className="column">
          <div className="columns is-multiline">
            {photos.map((photo, index) => (
              <div key={index} className="column is-3">
                <div className="card">
                  <div className="column">
                    <div onClick={() => this.setState({ editPhotoModalVisible: true })}>
                      <img src={photo.preview} alt="preview" />
                      <span>
                        {photo.caption}
                      </span>
                    </div>
                    <div className="btn-group">
                      <button className="button is-small" onClick={() => this.setState({ editPhotoModalVisible: true })}>Edit</button>
                      <button className="button is-danger is-small" onClick={() => this.setState({ deletePhotoModalVisible: true })}>Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
            }
          </div>
        </div>
        <NewPhotoModal
          isVisible={addPhotoModalVisible}
          onClose={this.onCloseAddModal}
          addPhoto={this.addPhoto}
          little
        />
        <EditPhotoModal
          isVisible={editPhotoModalVisible}
          onClose={this.onCloseEditModal}
          editPhoto={this.editPhoto}
          little
        />
        <DeletePhotoModal
          isVisible={deletePhotoModalVisible}
          onClose={this.onCloseDeleteModal}
          deletePhoto={this.deletePhoto}
          little
        />
      </div>
    );
  }
}

export default Photos;
