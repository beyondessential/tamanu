import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Paper, Grid, Tabs, Tab,
} from '@material-ui/core';
import {
  Preloader, BackButton, TopBar, Container,
} from '../../../components';
import { MUI_SPACING_UNIT as spacing } from '../../../constants';
import actions from '../../../actions/patients';
import Allergy from '../components/Allergy';
import Condition from '../components/Condition';
import Procedure from '../components/Procedure';
import OperativePlan from '../components/OperativePlan';
import PatientQuickLinks from '../components/PatientQuickLinks';
import History from './History';
import General from './General';
import Photos from './Photos';
import Appointments from './Appointments';
import Visits from './Visits';
import Medication from './Medication';
import Imaging from './Imaging';
import LabRequests from '../components/LabRequests';
import Programs from './Programs';
import Pregnancy from './Pregnancy';
import TopRow from '../components/TopRow';

class EditPatient extends Component {
  state = {
    patient: {},
    loading: true,
    patientModel: {},
    selectedTab: 'history',
  }

  componentDidMount() {
    const { id } = this.props.match.params;
    this.props.fetchPatient({ id });
  }

  componentWillReceiveProps(newProps) {
    const { id: oldId } = this.props.match.params;
    const { id: newId } = newProps.match.params;
    if (oldId !== newId) {
      this.props.fetchPatient({ id: newId });
      this.changeTab('history');
    } else {
      this.handleChange(newProps);
    }
  }

  changeTab = (tabName) => {
    this.setState({ selectedTab: tabName });
  }

  handleChange(props = this.props) {
    let updates = {};
    const { patient, action, loading } = props;
    if (!loading) {
      // handle model's change
      // visit.on('change', () => this.forceUpdate());
      updates = Object.assign(updates, {
        patientModel: patient,
        patient: patient.toJSON({ relations: true }),
        action,
        loading,
      });
    }
    this.setState(updates);
  }

  renderTabContents() {
    const { selectedTab, patient, patientModel } = this.state;
    const { history } = this.props;

    switch (selectedTab) {
      case 'general':
        return (
          <General
            history={history}
            patient={patient}
            patientModel={patientModel}
            savePatient={this.props.savePatient}
          />
        );
      case 'photos':
        return <Photos />;
      case 'appointment':
        return (
          <Appointments
            history={history}
            patient={patient}
            patientModel={patientModel}
          />
        );
      case 'visit':
        return (
          <Visits
            history={history}
            patient={patient}
            patientModel={patientModel}
          />
        );
      case 'medication':
        return (
          <Medication
            history={history}
            patient={patient}
            patientModel={patientModel}
          />
        );
      case 'imaging':
        return (
          <Imaging
            history={history}
            patientModel={patientModel}
          />
        );
      case 'labs':
        return (
          <LabRequests
            history={history}
            parentModel={patientModel}
            patientSex={patientModel.get('sex')}
          />
        );
      case 'programs':
        return <Programs />;
      case 'pregnancy':
        return (
          <Pregnancy
            history={history}
            patient={patient}
            patientModel={patientModel}
          />
        );
      case 'history':
      default:
        return (
          <History
            history={history}
            patientModel={patientModel}
            changeTab={this.changeTab}
          />
        );
    }
  }

  renderTabs() {
    const { selectedTab, patient } = this.state;

    return (
      <Tabs value={selectedTab} style={{ marginBottom: spacing }}>
        {
          [
            { value: 'history', label: 'History' },
            { value: 'general', label: 'General' },
            { value: 'photos', label: 'Photos' },
            { value: 'appointment', label: 'Appointment' },
            { value: 'visit', label: 'Visit' },
            { value: 'medication', label: 'Medication' },
            { value: 'imaging', label: 'Imaging' },
            { value: 'labs', label: 'Labs' },
            { value: 'pregnancy', label: 'Pregnancy', condition: () => patient.sex === 'female' },
            { value: 'programs', label: 'Programs' },
          ]
            .filter(item => !item.condition || item.condition())
            .map(({ value, label }) => (
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

  render() {
    const { loading } = this.state;
    if (loading) return <Preloader />; // TODO: make this automatic

    const { patient, patientModel, selectedTab } = this.state;
    return (
      <React.Fragment>
        <TopBar title="View Patient" />
        <Container style={{ paddingBottom: 90 }}>
          <TopRow patient={patient} />
          <Grid container spacing={8} style={{ paddingBottom: 16 }}>
            <Grid container item xs spacing={8}>
              <Condition patientModel={patientModel} />
              <Procedure patientModel={patientModel} />
              <OperativePlan patientModel={patientModel} />
            </Grid>
            <Grid container item xs>
              <Allergy patientModel={patientModel} />
            </Grid>
          </Grid>
          <Grid container spacing={8}>
            { this.renderTabs() }
            <Grid container>
              { this.renderTabContents() }
            </Grid>
            {selectedTab !== 'general'
              && (
                <Grid item style={{ marginTop: spacing, padding: 0 }}>
                  <BackButton to="/patients" />
                </Grid>
              )
            }
          </Grid>
        </Container>
        <PatientQuickLinks patient={patient} />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  const {
    patient, action, loading, saved, error,
  } = state.patients;
  return {
    patient, action, loading, saved, error,
  };
}

const { patient: patientActions } = actions;
const { fetchPatient, savePatient } = patientActions;
const mapDispatchToProps = dispatch => ({
  fetchPatient: (params) => dispatch(fetchPatient(params)),
  savePatient: (params) => dispatch(savePatient(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(EditPatient);
