import React, { Component } from 'react';
import NewPhotoModal from '../components/NewPhotoModal';

class Photos extends Component {
  state = {
    photoModalVisible: false
  }

  onCloseModal = () => {
    this.setState({ photoModalVisible: false });
  }
  render() {
    const { photoModalVisible } = this.state;
    return (
      <div>
        <div className="column has-text-right">
          <button className="button is-primary" onClick={() => this.setState({ photoModalVisible: true })}>+ New Photo</button>
        </div>
        <NewPhotoModal
          isVisible={photoModalVisible}
          onClose={this.onCloseModal}
          little
        />
      </div>
    );
  }
}

export default Photos;
