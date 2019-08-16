import React, { Component, Fragment } from 'react';
import { Grid } from '@material-ui/core';
import NoteModal from '../../components/NoteModal';
import { NewButton, TabHeader } from '../../../../components';
import HistoryItem from './HistoryItem';

export default class HistoryTab extends Component {
  state = {
    noteModalVisible: false,
    patientsHistory: [],
  };

  componentWillMount() {
    this.handleChange();
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  onCloseModal = () => {
    this.setState({ noteModalVisible: false });
  };

  handleChange(props = this.props) {
    const { patientModel } = props;
    this.setState({ patientsHistory: patientModel.getHistory() });
  }

  render() {
    const { patientModel, changeTab } = this.props;
    const { noteModalVisible, patientsHistory } = this.state;
    return (
      <Fragment>
        <TabHeader>
          <NewButton
            onClick={() => this.setState({ noteModalVisible: true })}
            can={{ do: 'create', on: 'note' }}
          >
            Add Note
          </NewButton>
        </TabHeader>
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
