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
import { LabRequestModel, LabTestModel } from '../../models';

const ButtonsContainer = styled.div`
  padding: 8px 8px 32px 8px;
  text-align: right;
  > button {
    margin-right: 8px
  }
`;

class Request extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTests: [],
      isFormValid: false,
      isLoading: true,
      selectedPatientsId: '',
    }
    this.handlePatientChange = this.handlePatientChange.bind(this);
    this.handleTestsListChange = this.handleTestsListChange.bind(this);
    this.handleVisitChange = this.handleVisitChange.bind(this);
    this.handleModelsChange = this.handleModelsChange.bind(this);
    this.handleFormInput = this.handleFormInput.bind(this);
    this.submitForm = this.submitForm.bind(this);
  }

  componentDidMount() {
    this.props.initLabRequest();
  }

  componentWillReceiveProps(newProps) {
    const { labRequestModel } = newProps;
    if (labRequestModel instanceof LabRequestModel) {
      labRequestModel.on('change', this.handleModelsChange);
    }
    this.handleFetchedLabRequest(newProps);
  }

  handleFetchedLabRequest(props = this.props) {
    const { patient, isLoading } = props;
    if (!isLoading) {
      this.setState({
        isLoading,
        selectedPatientsId: patient._id
      });
    }
  }

  handleModelsChange() {
    const { labRequestModel } = this.props;
    const changedAttributes = labRequestModel.changedAttributes();
    const isFormValid = labRequestModel.isValid();
    this.setState({ ...changedAttributes, isFormValid });
  }

  handlePatientChange(selectedPatientsId) {
    this.setState({ selectedPatientsId });
  }

  handleVisitChange(visit) {
    this.handleFormChange({ visit });
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
    const { labRequestModel } = this.props;
    labRequestModel.set(change);
  }

  updateFormsStatus() {
    const { visit, selectedTests } = this.state;
    let isFormValid = false;
    if (visit && selectedTests) isFormValid = true;
    this.setState({ isFormValid });
  }

  submitForm(event) {
    event.preventDefault();
    const { labRequestModel } = this.props;
    this.props.createLabRequest({ labRequestModel });
  }

  render() {
    const { isLoading } = this.state;
    if (isLoading) return <Preloader />;

    const { labRequestModel, isPatientSelected, labTestTypes, patient } = this.props;
    const { selectedPatientsId, visit, isFormValid } = this.state;
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
                  patient={selectedPatientsId}
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

Request.propTypes = {
  initLabRequest: PropTypes.func.isRequired,
  createLabRequest: PropTypes.func.isRequired,
  patient: PropTypes.object,
  labTestTypes: PropTypes.arrayOf(PropTypes.object),
  labRequestModel: PropTypes.object,
  isLoading: PropTypes.bool,
  error: PropTypes.object,
}

Request.defaultProps = {
  patient: {},
  labTestTypes: [],
  labRequestModel: new LabRequestModel(),
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

export default connect(mapStateToProps, mapDispatchToProps)(Request);