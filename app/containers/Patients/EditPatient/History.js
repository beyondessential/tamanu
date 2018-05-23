import React, { Component } from 'react';
import NewNoteModal from '../components/NewNoteModal';

class History extends Component {
  state = {
    noteModalVisible: false
  }

  onCloseModal = () => {
    this.setState({ noteModalVisible: false });
  }

  render() {
    const { noteModalVisible } = this.state;
    const patientId = 123456;
    return (
      <div>
        <div className="column has-text-right">
          <button className="button is-primary" onClick={() => this.setState({ noteModalVisible: true })}>+ New Note</button>
        </div>
        <div className="column">
          <div className="history-pane">
            <a className="admission" onClick={() => this.props.history.push(`/patients/editvisit/${patientId}`)}>5/14/2018 - 5/16/2018 Admission</a>
          </div>
        </div>
        <NewNoteModal
          isVisible={noteModalVisible}
          onClose={this.onCloseModal}
          little
        />
      </div>
    );
  }
}

export default History;
