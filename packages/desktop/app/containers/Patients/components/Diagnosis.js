import React, { Component } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import DiagnosisModal from './DiagnosisModal';
import { dateFormat } from '../../../constants';
import { TextButton } from '../../../components';
import { PatientDiagnosisModel } from '../../../models';

class Diagnosis extends Component {
  static propTypes = {
    parentModel: PropTypes.object.isRequired,
    showSecondary: PropTypes.bool,
  }

  static defaultProps = {
    showSecondary: false,
  }

  state = {
    modalVisible: false,
    action: 'new',
    patientDiagnosisModel: new PatientDiagnosisModel(),
  }

  componentWillMount() {
    const { parentModel } = this.props;
    const { diagnoses } = parentModel.attributes;
    this.setState({ diagnoses });
  }

  componentWillReceiveProps(newProps) {
    const { parentModel } = newProps;
    const { diagnoses } = parentModel.attributes;
    this.setState({ diagnoses });
  }

  onCloseModal = () => {
    this.setState({ modalVisible: false });
  }

  editItem(itemId = null) {
    const { parentModel } = this.props;
    let patientDiagnosisModel = parentModel.get('diagnoses').findWhere({ _id: itemId });
    if (!patientDiagnosisModel) patientDiagnosisModel = new PatientDiagnosisModel();
    this.setState({
      modalVisible: true,
      action: patientDiagnosisModel.id ? 'update' : 'new',
      patientDiagnosisModel,
    });
  }

  render() {
    const {
      parentModel,
      showSecondary,
    } = this.props;
    const {
      modalVisible,
      action,
      patientDiagnosisModel,
      diagnoses: allDiagnoses,
    } = this.state;
    // filter diagnosis type i-e primary or secondary
    const diagnoses = allDiagnoses.toJSON().filter(diagnosis => diagnosis.active && diagnosis.secondaryDiagnosis === showSecondary);

    return (
      <div>
        <div className={`column p-b-0 ${!diagnoses.length && showSecondary ? 'is-hidden' : ''}`}>
          <span className="title">{`${showSecondary ? 'Secondary' : 'Primary'} Diagnosis `}</span>
          <TextButton
            className={showSecondary ? 'is-hidden' : ''}
            can={{ do: 'create', on: 'diagnosis' }}
            onClick={() => this.editItem()}
          >
            {' '}
+ Add Diagnosis
            {' '}
          </TextButton>
          <div className="clearfix" />
          {diagnoses.map((diagnosis, k) => {
            const { diagnosis: { name: diagnosisName = '' } = {} } = diagnosis;
            return (
              <React.Fragment key={diagnosis._id}>
                {k > 0 ? ', ' : ''}
                <TextButton
                  can={{ do: 'read', on: 'diagnosis' }}
                  onClick={() => this.editItem(diagnosis._id)}
                >
                  {`${diagnosisName} (${moment(diagnosis.date).format(dateFormat)})`}
                </TextButton>
              </React.Fragment>
            );
          })}
        </div>
        <DiagnosisModal
          patientDiagnosisModel={patientDiagnosisModel}
          parentModel={parentModel}
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
