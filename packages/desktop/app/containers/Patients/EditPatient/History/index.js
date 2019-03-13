import React, { Component, Fragment } from 'react';
import NoteModal from '../../components/NoteModal';
import { NewButton } from '../../../../components';
import Visit from './Visit';
import Medication from './Medication';
import ImagingRequest from './ImagingRequest';
import LabRequest from './LabRequest';
import Appointment from './Appointment';

const HistoryRow = ({ objectType, ...props }) => {
  switch (objectType) {
    case 'visit':
      return <Visit {...props} />;
    case 'medication':
      return <Medication {...props} />;
    case 'imagingRequest':
      return <ImagingRequest {...props} />;
    case 'labRequest':
      return <LabRequest {...props} />;
    case 'appointment':
      return <Appointment {...props} />;
  }
}

class History extends Component {
  state = {
    noteModalVisible: false,
    patientsHistory: []
  }

  componentWillMount() {
    this.handleChange();
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  handleChange(props = this.props) {
    const { patientModel } = props;
    this.setState({ patientsHistory: patientModel.getHistory() });
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
    const { noteModalVisible, patientsHistory } = this.state;
    return (
      <div>
        <div className="column has-text-right">
          <NewButton
            onClick={() => this.setState({ noteModalVisible: true })}
            can={{ do: 'create', on: 'note' }}
          >Add Note </NewButton>
        </div>
        <div className="column">
          {patientsHistory.map(({ objectType, object }) => (
            <HistoryRow
              key={object._id}
              item={object}
              patientModel={patientModel}
              gotoItem={this.gotoItem}
              objectType={objectType}
            />
          ))}
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