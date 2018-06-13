import React, { Component } from 'react';
import AddAllergyModal from '../components/AddAllergyModal';

class Procedure extends Component {
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
        <div className="column p-b-0">
          <span className="title">Procedures</span>
          <div className="clearfix" />
          {patient.allergies.map((allergy, k) => {
            return (
              <React.Fragment key={allergy._id}>
                {k > 0 ? ', ' : ''}
                <a className="add-button" onClick={() => this.setState({ modalVisible: true, action: 'edit', item: allergy })}>{allergy.name}</a>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }
}

export default Procedure;
