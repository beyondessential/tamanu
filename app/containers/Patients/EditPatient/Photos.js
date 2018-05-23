import React, { Component } from 'react';
import NewPhotoModal from '../components/NewPhotoModal';

class Photos extends Component {
  state = {
    photoModalVisible: false,
    photos: []
  }

  onCloseModal = () => {
    this.setState({ photoModalVisible: false });
  }

  addPhoto = (file) => {
    this.setState({ photoModalVisible: false });
    const { photos } = this.state;
    const selectedFiles = photos;
    selectedFiles.push(file);
    this.setState({
      photos: selectedFiles,
    });
  }

  render() {
    const { photoModalVisible, photos } = this.state;
    console.log('file', photos);
    return (
      <div>
        <div className="column has-text-right">
          <button className="button is-primary" onClick={() => this.setState({ photoModalVisible: true })}>+ New Photo</button>
        </div>
        <div className="column">
          <div className="columns">
            {photos.map((photo, index) => (
              <div key={index} className="column is-3">
                <div className="card">
                  <div className="column">
                    <img src={photo.preview} alt="preview" />
                    <span>
                      Title
                    </span>
                    <div>
                      <button className="button">Edit</button>
                      <button className="button is-danger">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
            }
          </div>
        </div>
        <NewPhotoModal
          isVisible={photoModalVisible}
          onClose={this.onCloseModal}
          addPhoto={this.addPhoto}
          little
        />
      </div>
    );
  }
}

export default Photos;
