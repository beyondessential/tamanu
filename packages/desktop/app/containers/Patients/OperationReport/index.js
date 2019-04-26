import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { capitalize } from 'lodash';
import TopRow from '../components/TopRow';
// import ActionsTaken from '../components/ActionsTaken';
import PreOpDiagnosis from './PreOpDiagnosis';
import {
  TextField, Container, TopBar, Preloader, DateField, Form,
  FormRow, BottomBar, UpdateButton, BackButton, Field, ArrayField,
} from '../../../components';
import { MUI_SPACING_UNIT as spacing } from '../../../constants';
import actions from '../../../actions/patients';
import { PatientModel, OperationReportModel } from '../../../models';

class OperationReport extends Component {
  static propTypes = {
    action: PropTypes.string.isRequired,
    fetchOperationReport: PropTypes.func.isRequired,
    saveOperationReport: PropTypes.func.isRequired,
    operationReportModel: PropTypes.oneOfType([
      PropTypes.instanceOf(OperationReportModel),
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
    const { fetchOperationReport } = this.props;
    fetchOperationReport();
  }

  componentWillReceiveProps(newProps) {
    const { loading } = newProps;
    if (!loading) this.setState({ loading });
  }

  submitForm = (values, { setSubmitting }) => {
    const { action, saveOperationReport, operationReportModel } = this.props;
    operationReportModel.set(values);
    saveOperationReport({ action, operationReportModel, setSubmitting });
  }

  render() {
    const { patientModel, operationReportModel, action } = this.props;
    const { loading } = this.state;
    if (loading) return <Preloader />;

    return (
      <React.Fragment>
        <TopBar title={`${capitalize(action)} Operation Report`} />
        <Container>
          <TopRow
            patient={patientModel.toJSON()}
            style={{ marginBottom: spacing * 2 }}
          />
          <PreOpDiagnosis operationReportModel={operationReportModel} />
          <Form
            initialValues={operationReportModel.toJSON()}
            onSubmit={this.submitForm}
            validationSchema={operationReportModel.validationSchema}
            render={({ isSubmitting }) => (
              <React.Fragment>
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
                    component={DateField}
                    name="surgeryDate"
                    label="Surgery Date"
                  />
                  <Field
                    component={TextField}
                    name="surgeon"
                    label="Surgeon"
                  />
                  <Field
                    component={TextField}
                    name="assistant"
                    label="Assistant"
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
                    name="additionalNotes"
                    label="Additional Notes"
                    multiline
                    rows="3"
                  />
                </FormRow>
                <BottomBar>
                  <BackButton />
                  <UpdateButton
                    type="submit"
                    isSubmitting={isSubmitting}
                    can={{ do: 'update', on: 'operationReport' }}
                  />
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
    patient: patientModel, operationReportModel, loading, action,
  } = patients;
  return {
    patientModel, operationReportModel, loading, action, patientId, visitId, id,
  };
}

const { operationReport: operationReportActions } = actions;
const { fetchOperationReport, saveOperationReport } = operationReportActions;
const mapDispatchToProps = (dispatch, {
  history,
  match: { params: { id = null, patientId } },
}) => ({
  fetchOperationReport: () => dispatch(fetchOperationReport({ id, patientId })),
  saveOperationReport: ({ ...props }) => dispatch(saveOperationReport({
    ...props,
    history,
  })),
});

export default connect(mapStateToProps, mapDispatchToProps)(OperationReport);
