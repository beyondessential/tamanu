import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Grid } from '@material-ui/core';
import { request as labRequestActions} from '../../actions/labs';
import moment from 'moment';
import { capitalize, isEmpty } from 'lodash';
import styled from 'styled-components';
import TopRow from '../Patients/components/TopRow';
import {
  TopBar,
  PatientAutocomplete,
  PatientRelationSelect,
  TextareaGroup,
  AddButton,
  CancelButton,
  Preloader,
} from '../../components';
import TestTypesList from './components/TestTypesList';
import { dateFormat } from '../../constants';
import { LabRequestModel, LabTestModel, PatientModel } from '../../models';

const ButtonsContainer = styled.div`
  padding: 8px 8px 32px 8px;
  text-align: right;
  > button {
    margin-right: 8px
  }
`;

class LabRequestForm extends Component {

  state = {
    isFormValid: false,
    isLoading: true,
    selectedPatientId: '',
  }

  labRequestModel = new LabRequestModel();

  constructor(props) {
    super(props);
    this.handlePatientChange = this.handlePatientChange.bind(this);
    this.handleTestsListChange = this.handleTestsListChange.bind(this);
    this.handleVisitChange = this.handleVisitChange.bind(this);
    this.handleFormInput = this.handleFormInput.bind(this);
    this.submitForm = this.submitForm.bind(this);
  }

  componentDidMount() {
    this.props.initLabRequest();
  }

  componentWillReceiveProps(newProps) {
    this.handleFetchedLabRequest(newProps);
  }

  handleFetchedLabRequest(props = this.props) {
    const { patient, isLoading } = props;
    if (!isLoading) {
      this.setState({
        isLoading,
        selectedPatientId: patient._id
      });
    }
  }

  updateValidation() {
    const { labRequestModel } = this;
    const isFormValid = labRequestModel.isValid();
    this.setState({ isFormValid });
  }

  handlePatientChange(selectedPatientId) {
    this.setState({ selectedPatientId });
    this.labRequestModel.set('patient', { _id: selectedPatientId });
    this.updateValidation();
  }

  handleVisitChange(visit) {
    this.labRequestModel.set('visit', { _id: visit });
    this.updateValidation();
  }

  handleTestsListChange(selectedTests) {
    const testTypesCollection = this.props.labTestTypes
      .filter(({ _id }) => selectedTests.has(_id))
      .map((labTestTypeModel) => new LabTestModel({ type: labTestTypeModel }));
    this.handleFormChange({ tests: testTypesCollection });
  }

  handleFormInput(event) {
    const { target: { name, value } } = event;
    this.handleFormChange({ [name]: value });
  }

  handleFormChange(change) {
    this.labRequestModel.set(change);
    this.updateValidation();
  }

  submitForm(event) {
    event.preventDefault();
    const { labRequestModel } = this;
    this.props.createLabRequest({ labRequestModel });
  }

  render() {
    const { isLoading } = this.state;
    if (isLoading) return <Preloader />;

    const { labRequestModel } = this;
    const { isPatientSelected, labTestTypes, patient } = this.props;
    const { selectedPatientId, visit, isFormValid } = this.state;
    const { tests: selectedTests } = labRequestModel.toJSON();
    return (
      <div className="create-content">
        <TopBar title="New Lab Request" />
        <form
          className="create-container"
          onSubmit={this.submitForm}
        >
          <div className="form with-padding">
            <Grid container spacing={8}>
              {isPatientSelected ?
                <Grid item container xs={12}>
                  <TopRow patient={patient} />
                </Grid> :
                <Grid item xs={6}>
                  <PatientAutocomplete
                    label="Patient"
                    name="patient"
                    onChange={this.handlePatientChange}
                    required
                  />
                </Grid>
              }
              <Grid item xs={6}>
                <PatientRelationSelect
                  className=""
                  patient={selectedPatientId}
                  relation="visits"
                  template={visit => `${moment(visit.startDate).format(dateFormat)} (${capitalize(visit.visitType)})`}
                  label="Visit"
                  name="visit"
                  value={visit}
                  onChange={this.handleVisitChange}
                />
              </Grid>
            </Grid>
            <Grid item container xs={6}>
              <TestTypesList
                labTestTypes={labTestTypes}
                selectedTests={selectedTests}
                onChange={this.handleTestsListChange}
              />
            </Grid>
            <Grid item container xs={6}>
              <TextareaGroup
                label="Notes"
                name="notes"
                onChange={this.handleFormInput}
              />
            </Grid>
            <ButtonsContainer>
              <CancelButton to="/labs" />
              <AddButton
                type="submit"
                disabled={!isFormValid}
              />
            </ButtonsContainer>
          </div>
        </form>
      </div>
    );
  }
}

LabRequestForm.propTypes = {
  initLabRequest: PropTypes.func.isRequired,
  createLabRequest: PropTypes.func.isRequired,
  patient: PropTypes.object,
  labTestTypes: PropTypes.arrayOf(PropTypes.object),
  isLoading: PropTypes.bool,
  error: PropTypes.object,
}

LabRequestForm.defaultProps = {
  patient: {},
  labTestTypes: [],
  isLoading: true,
  error: {},
}

function mapStateToProps({
  labs: { patient, labTestTypes, isLoading, error } },
  { match: { params: { patientId = false } = {} } }
) {
  return { patient, labTestTypes, isLoading, error, isPatientSelected: patientId };
}

const { initLabRequest, createLabRequest } = labRequestActions;
const mapDispatchToProps = (
  dispatch,
  { match: { params: { patientId } = {} } }
) => ({
  initLabRequest: () => dispatch(initLabRequest(patientId)),
  createLabRequest: (params) => dispatch(createLabRequest(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(LabRequestForm);
