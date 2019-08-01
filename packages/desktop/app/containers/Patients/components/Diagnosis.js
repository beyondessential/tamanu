import React, { Component } from 'react';
import { Grid, Typography } from '@material-ui/core';
import moment from 'moment';
import PropTypes from 'prop-types';
import DiagnosisModal from './DiagnosisModal';
import { dateFormat, MUI_SPACING_UNIT as spacing } from '../../../constants';
import { TextButton } from '../../../components';
import { PatientDiagnosisModel } from '../../../models';

class Diagnosis extends Component {
  static propTypes = {
    parentModel: PropTypes.instanceOf(Object).isRequired,
    showSecondary: PropTypes.bool,
  };

  static defaultProps = {
    showSecondary: false,
  };

  state = {
    modalVisible: false,
    action: 'new',
    patientDiagnosisModel: new PatientDiagnosisModel(),
  };

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
  };

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
    const { parentModel, showSecondary } = this.props;
    const { modalVisible, action, patientDiagnosisModel, diagnoses: allDiagnoses } = this.state;
    // filter diagnosis type i-e primary or secondary
    const diagnoses = allDiagnoses
      .toJSON()
      .filter(diagnosis => diagnosis.active && diagnosis.secondaryDiagnosis === showSecondary);

    if (showSecondary && !diagnoses.length) return null;
    return (
      <React.Fragment>
        <Grid container item>
          <Grid item style={{ paddingRight: spacing }}>
            <Typography variant="body2">
              {`${showSecondary ? 'Secondary' : 'Primary'} Diagnosis`}
            </Typography>
          </Grid>
          <Grid item>
            <TextButton can={{ do: 'create', on: 'diagnosis' }} onClick={() => this.editItem()}>
              + Add Diagnosis
            </TextButton>
          </Grid>
        </Grid>
        <Grid container item xs={12} style={{ paddingTop: 0 }}>
          {diagnoses.map((diagnosis, k) => {
            const { diagnosis: { name: diagnosisName = '' } = {} } = diagnosis;
            return (
              <Grid item key={diagnosis._id}>
                {k > 0 ? ', ' : ''}
                <TextButton
                  can={{ do: 'read', on: 'diagnosis' }}
                  onClick={() => this.editItem(diagnosis._id)}
                >
                  {`${diagnosisName} (${moment(diagnosis.date).format(dateFormat)})`}
                </TextButton>
              </Grid>
            );
          })}
        </Grid>
        <DiagnosisModal
          patientDiagnosisModel={patientDiagnosisModel}
          parentModel={parentModel}
          action={action}
          isVisible={modalVisible}
          onClose={this.onCloseModal}
          little
        />
      </React.Fragment>
    );
  }
}

export default Diagnosis;
