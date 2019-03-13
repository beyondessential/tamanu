import React, { Component, Fragment } from 'react';
import NoteModal from '../../components/NoteModal';
import { NewButton } from '../../../../components';
import Visit from './Visit';
import Medication from './Medication';
import ImagingRequest from './ImagingRequest';
import LabRequest from './LabRequest';
import Appointment from './Appointment';

class History extends Component {
  state = {
    noteModalVisible: false,
    history: []
  }

  componentWillMount() {
    const { patientModel } = this.props;
    const history = patientModel.getHistory();
    this.setState({ history });
  }

  componentWillReceiveProps(newProps) {
    const { patientModel } = newProps;
    const history = patientModel.getHistory();
    this.setState({ history });
  }

  onCloseModal = () => {
    this.setState({ noteModalVisible: false });
  }

  gotoItem = (objectType, { _id }) => {
    const { patientModel } = this.props;
    switch (objectType) {
      case 'visit':
        this.props.history.push(`/patients/visit/${patientModel.id}/${_id}`);
      break;
      case 'medication':
        this.props.changeTab('medication');
      break;
      case 'imagingRequest':
        this.props.history.push(`/imaging/request/${_id}`);
      break;
      case 'labRequest':
        this.props.history.push(`/labs/request/${_id}`);
      break;
      case 'appointment':
        this.props.history.push(`/appointments/appointment/${_id}`);
      break;
    }
  }

  render() {
    const { patientModel } = this.props;
    const { noteModalVisible, history } = this.state;
    return (
      <div>
        <div className="column has-text-right">
          <NewButton
            onClick={() => this.setState({ noteModalVisible: true })}
            can={{ do: 'create', on: 'note' }}
          >Add Note </NewButton>
        </div>
        <div className="column">
          {history.map(({ objectType, object }) => {
            const props = {
              key: `${objectType}-${object._id}`,
              item: object,
              patientModel,
              gotoItem: this.gotoItem,
            };
            if (objectType === 'visit') return <Visit {...props} />;
            if (objectType === 'medication') return <Medication {...props} />;
            if (objectType === 'imagingRequest') return <ImagingRequest {...props} />;
            if (objectType === 'labRequest') return <LabRequest {...props} />;
            if (objectType === 'appointment') return <Appointment {...props} />;
          })}
        </div>
        <NoteModal
          isVisible={noteModalVisible}
          onClose={this.onCloseModal}
          patientModel={patientModel}
          action="new"
          showVisits
          little
        />
      </div>
    );
  }
}

export default History;