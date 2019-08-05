import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { capitalize } from 'lodash';
import { Grid, Tab, Tabs } from '@material-ui/core';
import { push } from 'react-router-redux';

import TopRow from '../components/TopRow';
import Allergy from '../components/Allergy';
import Diagnosis from '../components/Diagnosis';
import OperativePlan from '../components/OperativePlan';
import OperationReport from '../components/OperationReport';
import LabRequests from '../components/LabRequests';
import Vitals from './Vitals';
import Notes from './Notes';
import Procedures from './Procedures';
import { Preloader, TopBar, Container, Button } from '../../../components';
import { MUI_SPACING_UNIT as spacing } from '../../../constants';
import { VisitForm } from '../../../forms/VisitForm';
import { Suggester } from '../../../utils/suggester';

const practitionerSuggester = new Suggester('practitioner');
const locationSuggester = new Suggester('location');

class EditVisit extends Component {
  state = {
    selectedTab: 'vitals',
  };

  onCloseModal() {
    this.props.resetSaved();
  }

  changeTab = tabName => {
    this.setState({ selectedTab: tabName });
  };

  handleFormSubmit = () => {};

  renderTabs() {
    const { selectedTab } = this.state;
    return (
      <Tabs value={selectedTab} style={{ marginBottom: spacing }}>
        {[
          { value: 'vitals', label: 'Vitals' },
          { value: 'notes', label: 'Notes' },
          { value: 'procedures', label: 'Procedures' },
          { value: 'labs', label: 'Labs' },
          { value: 'reports', label: 'Reports' },
        ].map(({ label, value }) => (
          <Tab
            key={value}
            style={{ minWidth: 'auto' }}
            label={label}
            value={value}
            onClick={() => this.changeTab(value)}
          />
        ))}
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
        return <Notes parentModel={visitModel} patientModel={patientModel} />;
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
    const { loading, action, patientModel, visitModel, checkIn, onCancel } = this.props;
    if (loading) return <Preloader />; // TODO: make this automatic

    return (
      <React.Fragment>
        <TopBar
          title={checkIn ? 'Patient Check In' : `${capitalize(action)} Visit`}
          subTitle={action === 'new' ? visitModel.get('status') : null}
        >
          <Button onClick={onCancel} variant="outlined">
            Back
          </Button>
        </TopBar>
        <Container>
          <TopRow patient={patientModel.toJSON()} />
          {action !== 'new' && (
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
          )}
          <VisitForm
            onSubmit={this.handleFormSubmit}
            editedObject={visitModel.toJSON()}
            practitionerSuggester={practitionerSuggester}
            locationSuggester={locationSuggester}
          />
        </Container>
      </React.Fragment>
    );
  }
}

EditVisit.propTypes = {
  resetSaved: PropTypes.func.isRequired,
  patientModel: PropTypes.instanceOf(Object).isRequired,
  visitModel: PropTypes.instanceOf(Object),
  checkIn: PropTypes.bool,
  action: PropTypes.string,
  loading: PropTypes.bool,
};

EditVisit.defaultProps = {
  checkIn: false,
  action: 'new',
  loading: true,
};

function mapStateToProps(state, { match: { path } }) {
  const { patient, visit, action, loading, error } = state.patients;
  return {
    patientModel: patient,
    action,
    loading,
    error,
    checkIn: path.indexOf('check-in') !== -1,
  };
}

const mapDispatchToProps = (
  dispatch,
  {
    match: {
      params: { patientId, id },
    },
  },
) => ({
  onCancel: () => dispatch(push(`/patients/editPatient/${patientId}`)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(EditVisit);
