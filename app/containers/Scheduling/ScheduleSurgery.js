import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import Serializer from '../../utils/form-serialize';
import InputGroup from '../../components/InputGroup';
import CustomDateInput from '../../components/CustomDateInput';
import { createMedication } from '../../actions/medications';

import { AddButton, BackButton } from '../../components/Button';

class ScheduleSurgery extends Component {
  state = {
    prescriptionDate: moment(),
  }

  onChangeDate = (date) => {
    this.setState({
      prescriptionDate: date,
    });
  }

  render() {
    const { prescriptionDate } = this.state;
    return (
      <div className="create-content">
        <div className="create-top-bar">
          <span>
            New Surgical Appointment
          </span>
        </div>
        <form
          className="create-container"
          onSubmit={(e) => {
            e.preventDefault();
            const medication = Serializer.serialize(e.target, { hash: true });
            if (medication.patient && medication.visit && medication.medication && medication.prescription) {
              this.props.createMedication(medication);
            } else {
              // this.setState({ formError: true });
            }
          }}
        >
          <div className="form">
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="patient"
                  label="Patient"
                  required
                />
              </div>
            </div>
            <div className="columns">
              <div className="column is-4">
                <div className="column">
                  <span className="header">
                    Start Date
                  </span>
                  <DatePicker
                    name="startDate"
                    customInput={<CustomDateInput />}
                    selected={prescriptionDate}
                    onChange={this.onChangeDate}
                    peekNextMonth
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </div>
              </div>
              <div className="column is-4">
                <div className="column">
                  <span className="header">
                    End Date
                  </span>
                  <DatePicker
                    name="endDate"
                    customInput={<CustomDateInput />}
                    selected={prescriptionDate}
                    onChange={this.onChangeDate}
                    peekNextMonth
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </div>
              </div>
            </div>
            <div className="columns">
              <div className="column is-6">
                <InputGroup
                  name="with"
                  label="With"
                  required
                />
              </div>
              <div className="column is-6">
                <InputGroup
                  name="location"
                  label="Location"
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <div className="column">
                  <span className="header">
                    Notes
                  </span>
                  <textarea className="textarea" />
                </div>
              </div>
            </div>
            <div className="column has-text-right">
              <BackButton to="/appointments/theater" />
              <AddButton />
            </div>
          </div>
        </form>
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  createMedication: medication => dispatch(createMedication(medication)),
});

export default connect(undefined, mapDispatchToProps)(ScheduleSurgery);
