import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Grid } from '@material-ui/core';
import styled from 'styled-components';
import * as labRequestActions from '../../actions/labs';
import TopRow from '../Patients/components/TopRow';
import {
  TopBar, PatientAutocomplete, PatientRelationSelect, Container,
  TextInput, AddButton, CancelButton, Preloader, FormRow,
} from '../../components';
import TestTypesList from './components/TestTypesList';
import { VISIT_SELECT_TEMPLATE } from '../../constants';
import { LabRequestModel, LabTestModel, PatientModel } from '../../models';

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
      selectedPatientId: '',
    };
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

  handleModelsChange = () => {
    const { labRequestModel } = this.props;
    const changedAttributes = labRequestModel.changedAttributes();
    const isFormValid = labRequestModel.isValid();
    this.setState({ ...changedAttributes, isFormValid });
  }

  handlePatientChange = ({ _id }) => {
    this.props.initLabRequest({ patientId: _id });
  }

  handleTestsListChange = (selectedTests) => {
    const testTypesCollection = this.props.labTestTypes
      .filter(({ _id }) => selectedTests.has(_id))
      .map((labTestTypeModel) => new LabTestModel({ type: labTestTypeModel }));
    this.handleFormChange({ tests: testTypesCollection });
  }

  handleFormInput = (event) => {
    const { target: { name, value } } = event;
    this.handleFormChange({ [name]: value });
  }

  submitForm = (event) => {
    event.preventDefault();
    const { labRequestModel } = this.props;
    this.props.createLabRequest({ labRequestModel });
  }

  updateFormsStatus() {
    const { visit, selectedTests } = this.state;
    let isFormValid = false;
    if (visit && selectedTests) isFormValid = true;
    this.setState({ isFormValid });
  }

  handleFormChange(change) {
    const { labRequestModel } = this.props;
    labRequestModel.set(change);
  }

  handleFetchedLabRequest(props = this.props) {
    const { isLoading } = props;
    if (!isLoading) {
      this.setState({ isLoading });
    }
  }

  render() {
    const { isLoading } = this.state;
    if (isLoading) return <Preloader />;

    const {
      labRequestModel, isPatientSelected, labTestTypes, patientModel, filterTestTypes,
    } = this.props;
    const {
      visit, notes, isFormValid,
    } = this.state;
    const { tests: selectedTests } = labRequestModel.toJSON();
    return (
      <React.Fragment>
        <TopBar title="New Lab Request" />
        <form onSubmit={this.submitForm}>
          <Container>
            <Grid container spacing={16} direction="column">
              {isPatientSelected
                && (
                  <Grid item container xs={12}>
                    <TopRow patient={patientModel.toJSON()} />
                  </Grid>
                )
              }
              <FormRow>
                {!isPatientSelected
                  && (
                    <PatientAutocomplete
                      label="Patient"
                      name="patient"
                      onChange={this.handlePatientChange}
                      required
                    />
                  )
                }
                <PatientRelationSelect
                  patientModel={patientModel}
                  relation="visits"
                  template={VISIT_SELECT_TEMPLATE}
                  label="Visit"
                  name="visit"
                  value={visit}
                  onChange={this.handleFormInput}
                />
              </FormRow>
              <TestTypesList
                labTestTypes={labTestTypes}
                selectedTests={selectedTests}
                onChange={this.handleTestsListChange}
                onFilter={filterTestTypes}
              />
              <FormRow>
                <TextInput
                  label="Notes"
                  name="notes"
                  value={notes}
                  onChange={this.handleFormInput}
                  rows="3"
                  multiline
                />
              </FormRow>
            </Grid>
            <ButtonsContainer>
              <CancelButton to="/labs" />
              <AddButton
                type="submit"
                disabled={!isFormValid}
              />
            </ButtonsContainer>
          </Container>
        </form>
      </React.Fragment>
    );
  }
}

Request.propTypes = {
  initLabRequest: PropTypes.func.isRequired,
  createLabRequest: PropTypes.func.isRequired,
  filterTestTypes: PropTypes.func.isRequired,
  patientModel: PropTypes.instanceOf(Object),
  labTestTypes: PropTypes.arrayOf(PropTypes.object),
  labRequestModel: PropTypes.instanceOf(Object),
  isPatientSelected: PropTypes.bool,
  isLoading: PropTypes.bool,
  error: PropTypes.object,
};

Request.defaultProps = {
  patientModel: new PatientModel(),
  labTestTypes: [],
  labRequestModel: new LabRequestModel(),
  isPatientSelected: false,
  isLoading: true,
  error: {},
};

function mapStateToProps({
  labs: {
    patient, labTestTypes, isLoading, error,
  },
},
{ match: { params: { patientId = false } = {} } }) {
  return {
    patientModel: patient, labTestTypes, isLoading, error, isPatientSelected: !!patientId,
  };
}

const { initLabRequest, createLabRequest, filterTestTypes } = labRequestActions;
const mapDispatchToProps = (
  dispatch,
  { match: { params: { patientId } = {} } },
) => ({
  initLabRequest: (props) => dispatch(initLabRequest({ patientId, ...props })),
  createLabRequest: (params) => dispatch(createLabRequest(params)),
  filterTestTypes: (params) => dispatch(filterTestTypes(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Request);
