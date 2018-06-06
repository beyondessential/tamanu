import React, { Component } from 'react';
import AddAllergyModal from '../components/AddAllergyModal';

class Allergy extends Component {
  state = {
    modalVisible: false
  }

  onCloseModal = () => {
    this.setState({ modalVisible: false });
  }

  render() {
    const { patient, model } = this.props;
    const { modalVisible } = this.state;
    return (
      <div>
        <div className="column">
          <span className="title">Patient Allergies  </span>
          <a className="add-button" onClick={() => this.setState({ modalVisible: true })}>
            + Add Allergy
          </a>
          {patient.allergies.map((allergy) => {
            return (
              <div key={allergy._id} className="clearfix">
                <a className="add-button" onClick={() => this.setState({ modalVisible: true })}>{allergy.name}</a>
              </div>
            );
          })}
        </div>
        <AddAllergyModal
          patient={patient}
          model={model}
          isVisible={modalVisible}
          onClose={this.onCloseModal}
          little
        />
      </div>
    );
  }
}

export default Allergy;
