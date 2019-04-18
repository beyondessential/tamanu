import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Grid } from '@material-ui/core';
import styled from 'styled-components';
import * as labRequestActions from '../../actions/labs';
import TopRow from '../Patients/components/TopRow';
import {
  TopBar, PatientVisitSelectField, PatientAutocompleteField, Container,
  TextField, AddButton, CancelButton, Preloader, FormRow, Form, Field,
} from '../../components';
import TestTypesList from './components/TestTypesList';
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
      isLoading: true,
      selectedPatientId: '',
    };
  }

  componentDidMount() {
    this.props.initLabRequest();
  }

  componentWillReceiveProps(newProps) {
    const { isLoading } = newProps;
    if (!isLoading) this.setState({ isLoading });
  }

  handlePatientChange = handleChange => event => {
    const { value } = event.target;
    handleChange(event);
    // load patient
    this.props.initLabRequest({ patientId: value });
  }

  buildTestTypeCollection = selectedTests => (
    this.props.labTestTypes
      .filter(({ _id }) => selectedTests.includes(_id))
      .map((labTestTypeModel) => new LabTestModel({ type: labTestTypeModel }))
  )

  handleTestTypesFilter = event => {
    const { filterTestTypes } = this.props;
    const { value } = event.target;
    filterTestTypes(value);
  }

  submitForm = ({ tests, ...values }) => {
    const { labRequestModel } = this.props;
    labRequestModel.set({ tests: this.buildTestTypeCollection(tests), ...values });
    this.props.createLabRequest({ labRequestModel });
  }

  render() {
    const {
      labRequestModel, isPatientSelected, labTestTypes, patientModel,
    } = this.props;
    const { isLoading } = this.state;
    if (isLoading) return <Preloader />;

    return (
      <React.Fragment>
        <TopBar title="New Lab Request" />
        <Form
          onSubmit={this.submitForm}
          initialValues={labRequestModel.toJSON()}
          validationSchema={labRequestModel.validationSchema}
          render={({ isSubmitting, handleChange }) => (
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
                      <Field
                        component={PatientAutocompleteField}
                        label="Patient"
                        name="patient"
                        onChange={this.handlePatientChange(handleChange)}
                        required
                      />
                    )
                  }
                  <Field
                    component={PatientVisitSelectField}
                    patientModel={patientModel}
                    name="visit"
                  />
                </FormRow>
                <Field
                  component={TestTypesList}
                  name="tests"
                  onFilter={this.handleTestTypesFilter}
                  labTestTypes={labTestTypes}
                />
                <FormRow>
                  <Field
                    component={TextField}
                    label="Notes"
                    name="notes"
                    rows="3"
                    multiline
                  />
                </FormRow>
              </Grid>
              <ButtonsContainer>
                <CancelButton to="/labs" />
                <AddButton
                  type="submit"
                  isSubmitting={isSubmitting}
                  can={{ do: 'create', on: 'labRequest' }}
                />
              </ButtonsContainer>
            </Container>
          )}
        />
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
