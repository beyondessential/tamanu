import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import moment from 'moment';
import { capitalize } from 'lodash';
import { Grid, Tab, Tabs } from '@material-ui/core';

import TopRow from '../components/TopRow';
import Allergy from '../components/Allergy';
import Diagnosis from '../components/Diagnosis';
import OperativePlan from '../components/OperativePlan';
import OperationReport from '../components/OperationReport';
import LabRequests from '../components/LabRequests';
import Vitals from './Vitals';
import Notes from './Notes';
import Procedures from './Procedures';
import actions from '../../../actions/patients';
import {
  Preloader, TextField, DateField, TopBar, BottomBar, AddButton, UpdateButton,
  CancelButton, SelectField, DischargeButton, CheckOutButton, Container, FormRow, Field, Form,
} from '../../../components';
import { visitOptions, visitStatuses, MUI_SPACING_UNIT as spacing } from '../../../constants';
import { VisitModel } from '../../../models';

class EditVisit extends Component {
  constructor(props) {
    super(props);
    this.discharge = this.discharge.bind(this);
    this.checkOut = this.checkOut.bind(this);
  }

  state = {
    selectedTab: 'vitals',
    updateVisitStatus: false,
  }

  componentWillMount() {
    this.props.initVisit();
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  componentWillUnmount() {
    const { visitModel } = this.state;
    if (visitModel) visitModel.off('change');
  }

  onCloseModal() {
    this.props.resetSaved();
  }

  changeTab = (tabName) => {
    this.setState({ selectedTab: tabName });
  }

  discharge = submitForm => () => {
    const { visitModel, patientModel } = this.props;
    visitModel.set('status', visitStatuses.DISCHARGED);
    if (visitModel.get('endDate') === null || visitModel.get('endDate') === '') visitModel.set('endDate', moment());
    patientModel.set('admitted', false);
    this.setState({ updateVisitStatus: true });
    submitForm();
  }

  checkOut = submitForm => () => {
    const { visitModel } = this.props;
    visitModel.set('status', visitStatuses.DISCHARGED);
    visitModel.set('endDate', moment());
    this.setState({ updateVisitStatus: true });
    submitForm();
  }

  handleFormSubmit = ({ status, endDate, ...values }) => {
    const { updateVisitStatus } = this.state;
    const { action, patientModel, visitModel } = this.props;
    visitModel.set(values, { silent: true });
    if (!updateVisitStatus) visitModel.set({ status, endDate }, { silent: true });
    this.props.submitForm({
      action,
      visitModel,
      patientModel,
      history: this.props.history,
      setStatus: updateVisitStatus,
    });
  }

  handleChange(props = this.props) {
    const { visitModel, loading } = props;
    if (!loading) {
      // handle model's change
      if (visitModel instanceof VisitModel) {
        visitModel.off('change');
        visitModel.on('change', () => this.forceUpdate());
      }
    }
  }

  renderTabs() {
    const { selectedTab } = this.state;
    return (
      <Tabs value={selectedTab} style={{ marginBottom: spacing }}>
        {
          [
            { value: 'vitals', label: 'Vitals' },
            { value: 'notes', label: 'Notes' },
            { value: 'procedures', label: 'Procedures' },
            { value: 'labs', label: 'Labs' },
            { value: 'reports', label: 'Reports' },
          ]
            .map(({ label, value }) => (
              <Tab
                key={value}
                style={{ minWidth: 'auto' }}
                label={label}
                value={value}
                onClick={() => this.changeTab(value)}
              />
            ))
        }
      </Tabs>
    );
  }

  renderTabsContent() {
    const { selectedTab } = this.state;
    const { visitModel, patientModel } = this.props;
    switch (selectedTab) {
      default:
        return null;
      case 'vitals':
        return <Vitals visitModel={visitModel} />;
      case 'notes':
        return (
          <Notes
            parentModel={visitModel}
            patientModel={patientModel}
          />
        );
      case 'procedures':
        return (
          <Procedures
            history={this.props.history}
            visitModel={visitModel}
            patientModel={patientModel}
          />
        );
      case 'labs':
        return (
          <LabRequests
            history={this.props.history}
            parentModel={visitModel}
            patientSex={patientModel.get('sex')}
          />
        );
      case 'reports':
        return 'Reports';
    }
  }

  render() {
    const {
      loading, action, patientModel, visitModel, checkIn,
    } = this.props;
    if (loading) return <Preloader />; // TODO: make this automatic

    return (
      <React.Fragment>
        <TopBar
          title={checkIn ? 'Patient Check In' : `${capitalize(action)} Visit`}
          subTitle={action === 'new' ? visitModel.get('status') : null}
        />
        <Container>
          <TopRow patient={patientModel.toJSON()} />
          {action !== 'new'
            && (
              <Grid container spacing={8} style={{ paddingBottom: 16 }}>
                <Grid item xs>
                  <Diagnosis parentModel={visitModel} patientModel={patientModel} />
                  <OperativePlan
                    parentModel={visitModel}
                    patientId={patientModel.id}
                    history={this.props.history}
                  />
                </Grid>
                <Grid item xs>
                  <Diagnosis parentModel={visitModel} patientModel={patientModel} showSecondary />
                  <Allergy patientModel={patientModel} />
                  <OperationReport
                    parentModel={visitModel}
                    patientId={patientModel.id}
                    history={this.props.history}
                  />
                </Grid>
              </Grid>
            )
          }
          <Form
            onSubmit={this.handleFormSubmit}
            initialValues={visitModel.toJSON()}
            validationSchema={visitModel.validationSchema}
            render={({ isSubmitting, values, submitForm }) => (
              <React.Fragment>
                <Grid
                  container
                  spacing={spacing * 2}
                  style={{ paddingTop: spacing * 2 }}
                >
                  <FormRow>
                    <Field
                      component={DateField}
                      label={values.visitType !== 'admission' ? 'Check-in' : 'Admission Date'}
                      name="startDate"
                      required
                    />
                    {values.visitType === 'admission'
                      && (
                        <Field
                          component={DateField}
                          label="Discharge Date"
                          name="endDate"
                        />
                      )
                    }
                    <Field
                      component={TextField}
                      name="location"
                      label="Location"
                    />
                  </FormRow>
                  <FormRow>
                    <Field
                      component={SelectField}
                      options={visitOptions}
                      label="Visit Type"
                      name="visitType"
                      disabled={action === 'edit'}
                    />
                    <Field
                      component={TextField}
                      name="examiner"
                      label="Doctor/Nurse"
                    />
                  </FormRow>
                  <FormRow>
                    <Field
                      component={TextField}
                      label="Reason For Visit"
                      name="reasonForVisit"
                      multiline
                      rows="3"
                    />
                  </FormRow>
                  {action === 'edit'
                    && (
                      <Grid
                        container
                        spacing={8}
                        style={{ paddingTop: spacing * 3 }}
                      >
                        { this.renderTabs() }
                        <Grid container>
                          { this.renderTabsContent() }
                        </Grid>
                      </Grid>
                    )
                  }
                </Grid>
                <BottomBar>
                  <CancelButton
                    to={`/patients/editPatient/${patientModel.get('_id')}`}
                  />
                  {action === 'new' && (
                  <AddButton
                    type="button"
                    disabled={isSubmitting}
                    can={{ do: 'create', on: 'visit' }}
                    onClick={submitForm}
                  />
                  )}
                  {action !== 'new' && (
                  <UpdateButton
                    type="button"
                    disabled={isSubmitting}
                    can={{ do: 'update', on: 'visit' }}
                    onClick={submitForm}
                  />
                  )}
                  {values.status === visitStatuses.ADMITTED
                    && (
                    <DischargeButton
                      onClick={this.discharge(submitForm)}
                      disabled={isSubmitting}
                      can={{ do: 'update', on: 'visit', field: 'status' }}
                    />
                    )
                  }
                  {values.status === visitStatuses.CHECKED_IN
                    && (
                    <CheckOutButton
                      onClick={this.checkOut(submitForm)}
                      disabled={isSubmitting}
                      can={{ do: 'update', on: 'visit', field: 'status' }}
                    />
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

EditVisit.propTypes = {
  initVisit: PropTypes.func.isRequired,
  submitForm: PropTypes.func.isRequired,
  resetSaved: PropTypes.func.isRequired,
  patientModel: PropTypes.instanceOf(Object).isRequired,
  visitModel: PropTypes.instanceOf(Object),
  checkIn: PropTypes.bool,
  action: PropTypes.string,
  loading: PropTypes.bool,
};

EditVisit.defaultProps = {
  visitModel: new VisitModel(),
  checkIn: false,
  action: 'new',
  loading: true,
};

function mapStateToProps(state, { match: { path } }) {
  const {
    patient, visit, action, loading, error,
  } = state.patients;
  const mappedProps = {
    patientModel: patient,
    action,
    loading,
    error,
    checkIn: path.indexOf('check-in') !== -1,
  };
  if (visit instanceof VisitModel) mappedProps.visitModel = visit;
  return mappedProps;
}

const { visit: visitActions } = actions;
const { initVisit, submitForm, resetSaved } = visitActions;
const mapDispatchToProps = (dispatch, { match: { params: { patientId, id } } }) => ({
  initVisit: (props) => dispatch(initVisit({ patientId, id, ...props })),
  submitForm: (params) => dispatch(submitForm(params)),
  resetSaved: (params) => dispatch(resetSaved(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(EditVisit);
