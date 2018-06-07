import React, { Component } from 'react';
import DiagnosisModal from '../components/DiagnosisModal';

class Diagnosis extends Component {
  state = {
    modalVisible: false,
    action: 'new',
    item: null
  }

  onCloseModal = () => {
    this.setState({ modalVisible: false });
  }

  render() {
    const { patient, model } = this.props;
    const { modalVisible, action, item } = this.state;
    return (
      <div>
        <div className="column">
          <span className="title">Primary Dignose  </span>
          <a className="add-button" onClick={() => this.setState({ modalVisible: true, action: 'new', item: null })}>
            + Add Dignosis
          </a>
        </div>
        <DiagnosisModal
          item={item}
          patient={patient}
          model={model}
          action={action}
          isVisible={modalVisible}
          onClose={this.onCloseModal}
          little
        />
      </div>
    );
  }
}

export default Diagnosis;
