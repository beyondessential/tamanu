import React, { Component } from 'react';
import moment from 'moment';
import DiagnosisModal from '../components/DiagnosisModal';
import { dateFormat } from '../../../constants';

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
    const { patient, model, showSecondary } = this.props;
    const { modalVisible, action, item } = this.state;
    const diagnoses = patient.diagnoses.filter(diagnosis => diagnosis.active && diagnosis.secondaryDiagnosis === showSecondary);
    return (
      <div>
        <div className={`column p-b-0 ${!diagnoses.length && showSecondary ? 'is-hidden' : ''}`}>
          <span className="title">{`${showSecondary ? 'Secondary' : 'Primary'} Diagnose`}</span>
          <a className={`${showSecondary ? 'is-hidden' : ''} add-button`} onClick={() => this.setState({ modalVisible: true, action: 'new', item: null })}>
            + Add Diagnosis
          </a>
          <div className="clearfix" />
          {diagnoses.map((diagnosis, k) => {
            return (
              <React.Fragment key={diagnosis._id}>
                {k > 0 ? ', ' : ''}
                <a className="add-button" onClick={() => this.setState({ modalVisible: true, action: 'edit', item: diagnosis })}>
                  {`${diagnosis.diagnosis} (${moment(diagnosis.date).format(dateFormat)})`}
                </a>
              </React.Fragment>
            );
          })}
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
