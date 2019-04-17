import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { capitalize } from 'lodash';
import TopRow from '../components/TopRow';
import {
  TextField, Container, TopBar, Preloader, ArrayField,
  FormRow, BottomBar, AddButton, UpdateButton, CancelButton,
  Button, SelectField, PatientVisitSelectField, Form, Field,
} from '../../../components';
import {
  MUI_SPACING_UNIT as spacing, operativePlanStatuses,
  operativePlanStatusList,
} from '../../../constants';
import actions from '../../../actions/patients';
import { PatientModel, OperativePlanModel } from '../../../models';

class OperativePlan extends Component {
  static propTypes = {
    action: PropTypes.string.isRequired,
    fetchOperativePlan: PropTypes.func.isRequired,
    saveOperativePlan: PropTypes.func.isRequired,
    operativePlanModel: PropTypes.oneOfType([
      PropTypes.instanceOf(OperativePlanModel),
      PropTypes.instanceOf(Object),
    ]).isRequired,
    patientModel: PropTypes.oneOfType([
      PropTypes.instanceOf(PatientModel),
      PropTypes.instanceOf(Object),
    ]).isRequired,
  }

  state = {
    loading: true,
  }

  componentDidMount() {
    const { fetchOperativePlan } = this.props;
    fetchOperativePlan();
  }

  componentWillReceiveProps(newProps) {
    const { loading } = newProps;
    if (!loading) this.setState({ loading });
  }

  markComplete = ({ setFieldValue, submitForm }) => () => {
    setFieldValue('status', operativePlanStatuses.COMPLETED);
    submitForm();
  }

  handleFormSubmit = (values, { setSubmitting }) => {
    const { action, saveOperativePlan, operativePlanModel } = this.props;
    operativePlanModel.set(values);
    saveOperativePlan({ action, operativePlanModel, setSubmitting });
  }

  render() {
    const { action, patientModel, operativePlanModel } = this.props;
    const { loading } = this.state;
    if (loading) return <Preloader />;

    return (
      <React.Fragment>
        <TopBar title={`${capitalize(action)} Operative Plan`} />
        <Container>
          <TopRow
            patient={patientModel.toJSON()}
            style={{ marginBottom: spacing * 2 }}
          />
          <Form
            onSubmit={this.handleFormSubmit}
            initialValues={operativePlanModel.toJSON()}
            validationSchema={operativePlanModel.validationSchema}
            render={({ isSubmitting, ...formActions }) => (
              <React.Fragment>
                {action === 'new'
                  && (
                    <FormRow xs={5}>
                      <Field
                        component={PatientVisitSelectField}
                        patientModel={patientModel}
                        name="visit"
                      />
                    </FormRow>
                  )
                }
                <FormRow>
                  <Field
                    component={TextField}
                    name="operationDescription"
                    label="Operation Description"
                    multiline
                    rows="3"
                  />
                </FormRow>
                <Field
                  name="actionsTaken"
                  label="Actions Taken"
                  buttonLabel="Add Action"
                  component={ArrayField}
                />
                <FormRow>
                  <Field
                    component={TextField}
                    name="surgeon"
                    label="Surgeon"
                  />
                  <Field
                    component={SelectField}
                    label="Status"
                    options={operativePlanStatusList}
                    name="status"
                  />
                  <Field
                    component={TextField}
                    name="caseComplexity"
                    label="Case Complexity"
                  />
                </FormRow>
                <FormRow>
                  <Field
                    component={TextField}
                    name="admissionInstructions"
                    label="Instructions Upon Admission"
                    multiline
                    rows="3"
                  />
                </FormRow>
                <FormRow>
                  <Field
                    component={TextField}
                    name="additionalNotes"
                    label="Additional Notes"
                    multiline
                    rows="3"
                  />
                </FormRow>
                <BottomBar>
                  <CancelButton o={`/patients/editPatient/${patientModel.id}`} />
                  {action === 'new'
                    ? (
                      <AddButton
                        type="submit"
                        isSubmitting={isSubmitting}
                        can={{ do: 'create', on: 'operativePlan' }}
                      />
                    )
                    : (
                      <React.Fragment>
                        <UpdateButton
                          type="submit"
                          isSubmitting={isSubmitting}
                          can={{ do: 'update', on: 'operativePlan' }}
                        />
                        <Button
                          onClick={this.markComplete(formActions)}
                          color="secondary"
                          variant="contained"
                          disabled={isSubmitting}
                        >
                          Complete Plan
                        </Button>
                      </React.Fragment>
                    )
                  }
                </BottomBar>
              </React.Fragment>
            )}
          />
        </Container>
      </React.Fragment>
    );
  }
}

function mapStateToProps({ patients }, { match: { params: { patientId, visitId, id } } }) {
  const {
    patient: patientModel, operativePlanModel, loading, action,
  } = patients;
  return {
    patientModel, operativePlanModel, loading, action, patientId, visitId, id,
  };
}

const { operativePlan: operativePlanActions } = actions;
const { fetchOperativePlan, saveOperativePlan } = operativePlanActions;
const mapDispatchToProps = (dispatch, {
  history,
  match: { params: { id = null, patientId } },
}) => ({
  fetchOperativePlan: () => dispatch(fetchOperativePlan({ id, patientId })),
  saveOperativePlan: ({ ...props }) => dispatch(saveOperativePlan({
    ...props,
    history,
    patientId,
  })),
});

export default connect(mapStateToProps, mapDispatchToProps)(OperativePlan);
