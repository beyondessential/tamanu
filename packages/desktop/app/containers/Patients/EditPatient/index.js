import React, { Component } from 'react';
import { connect } from 'react-redux';

import { BackButton } from '../../../components/Button';

import { Preloader } from '../../../components';
import actions from '../../../actions/patients';
import Allergy from '../components/Allergy';
import Diagnosis from '../components/Diagnosis';
import Procedure from '../components/Procedure';
import OperativePlan from '../components/OperativePlan';
import History from './History';
import General from './General';
import Photos from './Photos';
import Appointments from './Appointments';
import Visits from './Visits';
import Medication from './Medication';
import Imaging from './Imaging';
import Labs from './Labs';
import Programs from './Programs';
import Pregnancy from './Pregnancy';
import TopRow from '../components/TopRow';

// import Serializer from '../../../utils/form-serialize';
import { PatientModel, AllergyModel } from '../../../models';

const classNames = require('classnames');

class EditPatient extends Component {
  state = {
    patient: {},
    loading: true,
    patientModel: {},
    selectedTab: '',
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

  // componentWillUnmount() {
  //   patientModel.off('change', this.handleChange);
  // }

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

  // handleChange = () => {
  //   const patient = patientModel.toJSON({ relations: true });
  //   const procedures = patientModel.getProcedures();
  //   this.setState({ patient, procedures });
  // }

  changeTab = (tabName) => {
    this.setState({ selectedTab: tabName });
  }

  renderTabContents() {
    const { selectedTab, patient, patientModel } = this.state;
    const { history } = this.props;

    switch(selectedTab) {
      case 'general':
        return (
          <General
            history={history}
            patient={patient}
            model={patientModel}
            savePatient={this.props.savePatient}
          />
        );
      case 'photos':
        return (
          <div className="column">
            <Photos />
          </div>
        );
      case 'appointment':
        return (
          <div className="column">
            <Appointments
              history={history}
              patient={patient}
              model={patientModel} />
          </div>
        );
      case 'visit':
        return (
          <Visits
            history={history}
            patient={patient}
            model={patientModel}
          />
        );
      case 'medication':
        return (
          <div className="column">
            <Medication
              history={history}
              patient={patient}
              model={patientModel}
            />
          </div>
        );
      case 'imaging':
        return (
          <div className="column">
            <Imaging />
          </div>
        );
      case 'labs':
        return (
          <div className="column">
            <Labs />
          </div>
        );
      case 'programs':
        return (
          <div className="column">
            <Programs />
          </div>
        );
      case 'pregnancy':
        return (
          <Pregnancy
            history={history}
            patient={patient}
            model={patientModel}
          />
        );
      case 'history':
      default:
        return (
          <History
            history={history}
            model={patientModel}
            changeTab={this.changeTab}
          />
        );
    }
  }

  renderTabs() {
    const { selectedTab, patient } = this.state;

    return [
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
    .map(item => (
      <li
        key={ item.value }
        className={selectedTab === item.value ? 'is-active selected' : ''}
      >
        <a onClick={() => this.changeTab(item.value)}>{ item.label }</a>
      </li>
    ));
  }

  render() {
    const { loading } = this.state;
    if (loading) return <Preloader />; // TODO: make this automatic

    const { selectedTab, patient, patientModel } = this.state;
    const { history } = this.props;

    return (
      <div>
        <div className="create-content">
          <div className="create-top-bar">
            <span>
              View Patient
            </span>
          </div>
          <div className="create-container">
            <div className="form">
              <div className="columns">
                <div className="column">
                  <TopRow patient={patient} />
                  <div className="columns border-bottom">
                    <div className="column">
                      <Diagnosis model={patientModel} />
                      <Procedure model={patientModel} />
                      <OperativePlan model={patientModel} />
                    </div>
                    <div className="column">
                      <Diagnosis model={patientModel} showSecondary />
                      <Allergy model={patientModel} />
                    </div>
                  </div>
                  <div className="columns">
                    <div className="column">
                      <div className="tabs">
                        <ul>
                          { this.renderTabs() }
                        </ul>
                      </div>
                      <div className="tab-content">
                        { this.renderTabContents() }
                      </div>
                    </div>
                  </div>
                  <div className={`column has-text-right ${selectedTab === 'general' ? 'is-hidden' : ''}`}>
                    <BackButton to="/patients" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* <ModalView
          isVisible={formError}
          onClose={this.onCloseModal}
          headerTitle="Warning!!!!"
          contentText="Please fill in required fields (marked with *) and correct the errors before saving."
          little
        /> */}
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { patient, action, loading, saved, error } = state.patients;
  return { patient, action, loading, saved, error };
}

const { patient: patientActions } = actions;
const { fetchPatient, savePatient } = patientActions;
const mapDispatchToProps = dispatch => ({
  fetchPatient: (params) => dispatch(fetchPatient(params)),
  savePatient: (params) => dispatch(savePatient(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(EditPatient);
