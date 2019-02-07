import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AllergyModal from './AllergyModal';
import { Button, TextButton } from '../../../components';

class Allergy extends Component {
  static propTypes = {
    model: PropTypes.object.isRequired,
  }

  state = {
    modalVisible: false,
    action: 'new',
    itemId: null,
    allergies: [],
  }

  componentWillMount() {
    const { model: Model } = this.props;
    const { allergies } = Model.attributes;
    this.setState({ allergies });
  }

  componentWillReceiveProps(newProps) {
    const { model: Model } = newProps;
    const { allergies } = Model.attributes;
    this.setState({ allergies });
  }

  onCloseModal = () => {
    this.setState({ modalVisible: false });
  }

  render() {
    const { model: Model } = this.props;
    const { modalVisible, action, itemId, allergies } = this.state;
    return (
      <div>
        <div className="column p-b-0">
          <span className="title">Patient Allergies  </span>
          <TextButton
            can={{ do: 'create', on: 'allergy' }}
            onClick={() => this.setState({ modalVisible: true, action: 'new', itemId: null })}
          > + Add Allergy </TextButton>
          <div className="clearfix" />
          {allergies.toJSON().map((allergy, k) => {
            return (
              <React.Fragment key={allergy._id}>
                {k > 0 ? ', ' : ''}
                <TextButton
                  can={{ do: 'create', on: 'allergy' }}
                  onClick={() => this.setState({ modalVisible: true, action: 'edit', itemId: allergy._id })}
                >{allergy.name}</TextButton>
              </React.Fragment>
            );
          })}
        </div>
        <AllergyModal
          itemId={itemId}
          model={Model}
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
