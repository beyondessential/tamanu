import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { assignIn } from 'lodash';
import moment from 'moment';

import Serializer from '../../../utils/form-serialize';
import AddAllergyModal from '../components/AddAllergyModal';
import History from './History';
import General from './General';
import Photos from './Photos';
import Appointments from './Appointments';
import Visits from './Visits';
import Medication from './Medication';
import Imaging from './Imaging';
import Labs from './Labs';

// import Serializer from '../../../utils/form-serialize';
import { PatientModel } from '../../../models';

const classNames = require('classnames');

class EditPatient extends Component {
  state = {
    selectedTab: '',
    allergyModalVisible: false,
    patient: this.props.model.attributes
  }

  componentDidMount() {
    const { id } = this.props.match.params;
    this.props.model.set({ _id: id });
    this.props.model.fetch();
    this.props.model.on('change', this.handleChange);
  }

  componentWillUnmount() {
    this.props.model.off('change', this.handleChange);
  }

  handleChange = () => {
    this.setState({ patient: assignIn(this.state.patient, this.props.model.changedAttributes()) });
    this.forceUpdate();
  }

  onCloseAllergyModal = () => {
    this.setState({ allergyModalVisible: false });
  }

  changeTab = (tabName) => {
    this.setState({
      selectedTab: tabName
    });
  }

  updatePatient = (patient) => {
    const updatedPatient = patient;
    updatedPatient.birthday = moment(this.props.updatedBirthday).format('YYYY-MM-DD');
    updatedPatient.referredDate = moment(this.props.updatedReferredDate).format('YYYY-MM-DD');
    this.props.model.set(updatedPatient);
    if (this.props.model.isValid()) {
      this.props.model.save(null, {
        // success: (model, response) => {
        success: () => {
          this.props.history.push('/patients');
        },
        // error: (model, response) => {
        error: () => {}
      });
    }
  }

  render() {
    const {
      selectedTab,
      allergyModalVisible,
      patient
    } = this.state;
    const { history } = this.props;
    return (
      <div>
        <div className="create-content">
          <div className="create-top-bar">
            <span>
              Edit Patient
            </span>
          </div>
          <form
            className="create-container"
            onSubmit={(e) => {
              e.preventDefault();
              const data = Serializer.serialize(e.target, { hash: true });
              console.log('updateData', data);
              this.updatePatient(data);
            }}
          >
            <div className="form">
              <div className="columns">
                <div className="column">
                  <div className="columns">
                    <div className="column is-8">
                      <div className="column">
                        <span className="title">Name: </span>
                        <span className="full-name">
                          {patient.firstName} {patient.lastName}
                        </span>
                      </div>
                    </div>
                    <div className="column is-4">
                      <div className="align-left">
                        <div className="card-info">
                          {patient.displayId}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="columns border-bottom">
                    <div className="column">
                      <div className="column">
                        <span className="title">Primary Dignose  </span>
                        <a className="add-button">
                          + Add Dignosis
                        </a>
                      </div>
                      <div className="column">
                        <span className="title">Operative Plan  </span>
                        <a className="add-button">
                          + Add Operative Plan
                        </a>
                      </div>
                    </div>
                    <div className="column">
                      <div className="column">
                        <span className="title">Patient Allergies  </span>
                        <a className="add-button" onClick={() => this.setState({ allergyModalVisible: true })}>
                          + Add Allergy
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="columns">
                    <div className="column">
                      <div className="tabs">
                        <ul>
                          <li className={classNames(selectedTab === '' || selectedTab === 'history' ? 'is-active selected' : '')}><a onClick={() => this.changeTab('history')}>History</a></li>
                          <li className={classNames(selectedTab === 'general' ? 'is-active selected' : '')}><a onClick={() => this.changeTab('general')}>General</a></li>
                          <li className={classNames(selectedTab === 'photos' ? 'is-active selected' : '')}><a onClick={() => this.changeTab('photos')}>Photos</a></li>
                          <li className={classNames(selectedTab === 'appointment' ? 'is-active selected' : '')}><a onClick={() => this.changeTab('appointment')}>Appointments</a></li>
                          <li className={classNames(selectedTab === 'visit' ? 'is-active selected' : '')}><a onClick={() => this.changeTab('visit')}>Visits</a></li>
                          <li className={classNames(selectedTab === 'medication' ? 'is-active selected' : '')}><a onClick={() => this.changeTab('medication')}>Medication</a></li>
                          <li className={classNames(selectedTab === 'imaging' ? 'is-active selected' : '')}><a onClick={() => this.changeTab('imaging')}>Imaging</a></li>
                          <li className={classNames(selectedTab === 'labs' ? 'is-active selected' : '')}><a onClick={() => this.changeTab('labs')}>Labs</a></li>
                        </ul>
                      </div>
                      <div className="tab-content">
                        {(selectedTab === '' || selectedTab === 'history') &&
                          <div className="column">
                            <History history={history} />
                          </div>
                        }
                        {selectedTab === 'general' &&
                          <General patient={patient} />
                        }
                        {selectedTab === 'photos' &&
                          <div className="column">
                            <Photos />
                          </div>
                        }
                        {selectedTab === 'appointment' &&
                          <div className="column">
                            <Appointments />
                          </div>
                        }
                        {selectedTab === 'visit' &&
                          <div className="column">
                            <Visits />
                          </div>
                        }
                        {selectedTab === 'medication' &&
                          <div className="column">
                            <Medication />
                          </div>
                        }
                        {selectedTab === 'imaging' &&
                          <div className="column">
                            <Imaging />
                          </div>
                        }
                        {selectedTab === 'labs' &&
                          <div className="column">
                            <Labs />
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="column has-text-right">
                <Link className="button is-danger cancel" to="/patients">Return</Link>
                <button className="button is-primary" type="submit">Update</button>
              </div>
            </div>
          </form>
        </div>
        {/* <ModalView
          isVisible={formError}
          onClose={this.onCloseModal}
          headerTitle="Warning!!!!"
          contentText="Please fill in required fields (marked with *) and correct the errors before saving."
          little
        /> */}
        <AddAllergyModal
          isVisible={allergyModalVisible}
          onClose={this.onCloseAllergyModal}
          little
        />
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { onePatient, updatedBirthday, updatedReferredDate } = state.patients;
  return {
    patient: onePatient,
    updatedBirthday,
    updatedReferredDate
  };
}

const mapDispatchToProps = () => ({
  model: new PatientModel(),
});

export default connect(mapStateToProps, mapDispatchToProps)(EditPatient);
