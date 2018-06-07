import React, { Component } from 'react';
import AddAllergyModal from '../components/AddAllergyModal';

class Allergy extends Component {
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
          <span className="title">Patient Allergies  </span>
          <a className="add-button" onClick={() => this.setState({ modalVisible: true, action: 'new', item: null })}>
            + Add Allergy
          </a>
          {patient.allergies.map((allergy) => {
            return (
              <div key={allergy._id} className="clearfix">
                <a className="add-button" onClick={() => this.setState({ modalVisible: true, action: 'edit', item: allergy })}>{allergy.name}</a>
              </div>
            );
          })}
        </div>
        <AddAllergyModal
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

export default Allergy;
