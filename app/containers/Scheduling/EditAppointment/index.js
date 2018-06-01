import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { assignIn } from 'lodash';
import moment from 'moment';

import Serializer from '../../../utils/form-serialize';
import { AppointmentModel } from '../../../models';

class EditAppointment extends Component {
  state = {
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
      patient
    } = this.state;
    return (
      <div>
        <div className="create-content">
          <div className="create-top-bar">
            <span>
              Edit Appointment
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
  model: new AppointmentModel(),
});

export default connect(mapStateToProps, mapDispatchToProps)(EditAppointment);
