import React, { Component, Fragment } from 'react';
import { Grid } from '@material-ui/core';
import NoteModal from '../../components/NoteModal';
import { NewButton } from '../../../../components';
import HistoryItem from './HistoryItem';

class HistoryTab extends Component {
  state = {
    noteModalVisible: false,
    patientsHistory: [],
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

  render() {
    const { patientModel, changeTab } = this.props;
    const { noteModalVisible, patientsHistory } = this.state;
    return (
      <Fragment>
        <Grid container justify="flex-end" style={{ marginBottom: 10 }}>
          <Grid item>
            <NewButton
              onClick={() => this.setState({ noteModalVisible: true })}
              can={{ do: 'create', on: 'note' }}
            >
Add Note
              {' '}
            </NewButton>
          </Grid>
        </Grid>
        <Grid container item>
          {patientsHistory.map(({ objectType, object }) => (
            <HistoryItem
              key={object._id}
              item={object}
              patientId={patientModel.id}
              objectType={objectType}
              changeTab={changeTab}
              history={this.props.history}
            />
          ))}
        </Grid>
        <NoteModal
          isVisible={noteModalVisible}
          onClose={this.onCloseModal}
          patientModel={patientModel}
          action="new"
          showVisits
          little
        />
      </Fragment>
    );
  }
}

export default HistoryTab;
