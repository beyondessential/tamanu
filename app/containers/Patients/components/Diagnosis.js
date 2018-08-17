import React, { Component } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import DiagnosisModal from './DiagnosisModal';
import { dateFormat } from '../../../constants';

class Diagnosis extends Component {
  static propTypes = {
    model: PropTypes.object.isRequired,
    showSecondary: PropTypes.bool,
  }

  static defaultProps = {
    showSecondary: false
  }

  state = {
    modalVisible: false,
    action: 'new',
    itemId: null
  }

  componentWillMount() {
    const { model: Model } = this.props;
    const { diagnoses } = Model.attributes;
    this.setState({ diagnoses });
  }

  componentWillReceiveProps(newProps) {
    const { model: Model } = newProps;
    const { diagnoses } = Model.attributes;
    this.setState({ diagnoses });
  }

  onCloseModal = () => {
    this.setState({ modalVisible: false });
  }

  render() {
    const { model: Model, showSecondary } = this.props;
    const { modalVisible, action, itemId, diagnoses: diagnosesAll } = this.state;
    const diagnoses = diagnosesAll.toJSON().filter(diagnosis => diagnosis.active && diagnosis.secondaryDiagnosis === showSecondary);
    return (
      <div>
        <div className={`column p-b-0 ${!diagnoses.length && showSecondary ? 'is-hidden' : ''}`}>
          <span className="title">{`${showSecondary ? 'Secondary' : 'Primary'} Diagnosis`}</span>
          <a className={`${showSecondary ? 'is-hidden' : ''} add-button`} onClick={() => this.setState({ modalVisible: true, action: 'new', itemId: null })}>
            + Add Diagnosis
          </a>
          <div className="clearfix" />
          {diagnoses.map((diagnosis, k) => {
            return (
              <React.Fragment key={diagnosis._id}>
                {k > 0 ? ', ' : ''}
                <a className="add-button" onClick={() => this.setState({ modalVisible: true, action: 'edit', itemId: diagnosis._id })}>
                  {`${diagnosis.diagnosis} (${moment(diagnosis.date).format(dateFormat)})`}
                </a>
              </React.Fragment>
            );
          })}
        </div>
        <DiagnosisModal
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

export default Diagnosis;
