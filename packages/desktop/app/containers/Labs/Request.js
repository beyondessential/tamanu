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
import TestsList from './components/TestsList';
import { dateFormat } from '../../constants';
import { LabModel, LabTestModel } from '../../models';

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
    const { labModel } = newProps;
    if (labModel instanceof LabModel) {
      labModel.on('change', this.handleModelsChange);
    }
    this.handleFetchedLabRequest(newProps);
  }

  handleFetchedLabRequest(props = this.props) {
    const { patient, tests, isLoading, match} = props;
    if (!isLoading) {
      this.setState({
        patient,
        tests,
        isLoading,
      });
    }
  }

  handleModelsChange() {
    const { labModel } = this.props;
    const changedAttributes = labModel.changedAttributes();
    const isFormValid = labModel.isValid();
    this.setState({ ...changedAttributes, isFormValid });
  }

  handlePatientChange(patient) {
    this.handleFormChange({ patient });
  }

  handleVisitChange(visit) {
    this.handleFormChange({ visit });
  }

  handleTestsListChange(selectedTests) {
    const testsCollection = this.props.tests
                              .filter(({ _id }) => selectedTests.has(_id))
                              .map((testModel) => new LabTestModel({ test: testModel }));
    this.handleFormChange({ tests: testsCollection });
  }

  handleFormInput(event) {
    const { target: { name, value } } = event;
    this.handleFormChange({ [name]: value });
  }

  handleFormChange(change) {
    const { labModel } = this.props;
    labModel.set(change);
  }

  updateFormsStatus() {
    const { visit, selectedTests } = this.state;
    let isFormValid = false;
    if (visit && selectedTests) isFormValid = true;
    this.setState({ isFormValid });
  }

  submitForm(event) {
    event.preventDefault();
    const { labModel } = this.props;
    this.props.createLabRequest({ labModel });
  }

  render() {
    const { isLoading } = this.state;
    if (isLoading) return <Preloader />;

    const { labModel, isPatientSelected } = this.props;
    const { patient, visit, tests, isFormValid } = this.state;
    const { tests: selectedTests } = labModel.toJSON();
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
                  patient={patient._id || patient}
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
              <TestsList
                tests={tests}
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
  tests: PropTypes.arrayOf(PropTypes.object),
  labModel: PropTypes.object,
  isLoading: PropTypes.bool,
  error: PropTypes.object,
  patientId: PropTypes.string,
}

Request.defaultProps = {
  patient: {},
  tests: [],
  labModel: new LabModel(),
  isLoading: true,
  error: {},
  patientId: '',
}

function mapStateToProps({
  labs: { patient, tests, isLoading, error } },
  { match: { params: { patientId = false } = {} } }
) {
  return { patient, tests, isLoading, error, isPatientSelected: patientId };
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